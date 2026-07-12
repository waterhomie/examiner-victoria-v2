from __future__ import annotations

import base64
from collections import OrderedDict
from dataclasses import dataclass
import io
import re
from threading import Lock
from uuid import uuid4

from .ai_provider import TRANSCRIPTION_MODEL, TTS_CACHE_MAX_ITEMS, get_client
from .core import config


@dataclass(frozen=True)
class TTSResult:
    audio: bytes
    content_type: str
    provider: str
    request_id: str | None = None


class TTSProviderError(RuntimeError):
    """Raised when a TTS provider cannot synthesize audio safely."""


class BaseTTSProvider:
    name = "base"
    content_type = "audio/mpeg"

    @property
    def configured(self) -> bool:
        return True

    def synthesize(self, text: str) -> TTSResult:
        raise NotImplementedError


class DisabledTTSProvider(BaseTTSProvider):
    name = "disabled"

    @property
    def configured(self) -> bool:
        return False

    def synthesize(self, text: str) -> TTSResult:
        raise TTSProviderError("tts disabled")


class GttsTTSProvider(BaseTTSProvider):
    name = "gtts"
    content_type = "audio/mpeg"

    def synthesize(self, text: str) -> TTSResult:
        from gtts import gTTS

        audio_buffer = io.BytesIO()
        gTTS(text=text, lang="en", tld="co.uk").write_to_fp(audio_buffer)
        return TTSResult(
            audio=audio_buffer.getvalue(),
            content_type=self.content_type,
            provider=self.name,
        )


class TencentCloudTTSProvider(BaseTTSProvider):
    name = "tencent"

    @property
    def configured(self) -> bool:
        return bool(
            config.TENCENTCLOUD_SECRET_ID
            and config.TENCENTCLOUD_SECRET_KEY
            and config.TENCENT_TTS_VOICE_TYPE
        )

    @property
    def content_type(self) -> str:
        codec = (config.TENCENT_TTS_CODEC or "mp3").lower()
        if codec == "mp3":
            return "audio/mpeg"
        if codec == "wav":
            return "audio/wav"
        return "application/octet-stream"

    def synthesize(self, text: str) -> TTSResult:
        if not self.configured:
            raise TTSProviderError("tencent tts is not configured")

        try:
            from tencentcloud.common import credential
            from tencentcloud.tts.v20190823 import models, tts_client
        except Exception as error:
            raise TTSProviderError("tencent tts sdk is unavailable") from error

        try:
            cred = credential.Credential(
                config.TENCENTCLOUD_SECRET_ID,
                config.TENCENTCLOUD_SECRET_KEY,
            )
            client = tts_client.TtsClient(cred, config.TENCENT_TTS_REGION)
            request = models.TextToVoiceRequest()
            request.Text = text
            request.SessionId = str(uuid4())
            request.PrimaryLanguage = 2
            request.VoiceType = int(str(config.TENCENT_TTS_VOICE_TYPE).strip())
            request.Codec = config.TENCENT_TTS_CODEC
            request.SampleRate = config.TENCENT_TTS_SAMPLE_RATE
            request.Speed = config.TENCENT_TTS_SPEED
            request.Volume = config.TENCENT_TTS_VOLUME
            response = client.TextToVoice(request)
            request_id = getattr(response, "RequestId", None)
            audio_base64 = getattr(response, "Audio", "") or ""
            audio = base64.b64decode(audio_base64, validate=True)
        except Exception as error:
            raise TTSProviderError(type(error).__name__) from error

        if not audio:
            raise TTSProviderError("empty tencent tts audio")
        return TTSResult(
            audio=audio,
            content_type=self.content_type,
            provider=self.name,
            request_id=request_id,
        )


TTS_CACHE: OrderedDict[tuple[str, str], TTSResult] = OrderedDict()
TTS_CACHE_LOCK = Lock()
TTS_PROVIDERS: dict[str, BaseTTSProvider] = {
    "disabled": DisabledTTSProvider(),
    "gtts": GttsTTSProvider(),
    "tencent": TencentCloudTTSProvider(),
}


def audio_filename_from_mime(mime_type: str) -> str:
    if "wav" in mime_type:
        return "ielts_answer.wav"
    if "mp4" in mime_type or "m4a" in mime_type:
        return "ielts_answer.m4a"
    if "mpeg" in mime_type or "mp3" in mime_type:
        return "ielts_answer.mp3"
    return "ielts_answer.webm"


def transcribe_audio(audio_bytes: bytes, mime_type: str = "audio/wav") -> str:
    audio_file = io.BytesIO(audio_bytes)
    audio_file.name = audio_filename_from_mime(mime_type)
    transcription = get_client().audio.transcriptions.create(
        model=TRANSCRIPTION_MODEL,
        file=audio_file,
        language="en",
    )
    text = getattr(transcription, "text", None)
    return text.strip() if text else ""


def clean_tts_text(text: str) -> str:
    cleaned = text.replace("*", "").replace("#", "").replace("- ", "")
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned or text.strip()


def normalize_tts_provider_name(raw: str | None = None) -> str:
    value = (raw or config.TTS_PROVIDER or "disabled").strip().lower()
    if value in TTS_PROVIDERS:
        return value
    return "disabled"


def get_tts_provider() -> BaseTTSProvider:
    return TTS_PROVIDERS[normalize_tts_provider_name()]


def tts_provider_is_configured() -> bool:
    return get_tts_provider().configured


def prepare_tts_text(text: str) -> str:
    clean_text = clean_tts_text(text)
    if not clean_text:
        raise TTSProviderError("empty tts text")
    if get_tts_provider().name == "tencent" and len(clean_text) > config.TENCENT_TTS_MAX_TEXT_CHARS:
        clean_text = clean_text[: config.TENCENT_TTS_MAX_TEXT_CHARS].strip()
    if not clean_text:
        raise TTSProviderError("empty tts text")
    return clean_text


def synthesize_speech(text: str) -> TTSResult:
    provider = get_tts_provider()
    clean_text = prepare_tts_text(text)
    cache_key = (provider.name, clean_text)
    with TTS_CACHE_LOCK:
        cached_result = TTS_CACHE.get(cache_key)
        if cached_result is not None:
            TTS_CACHE.move_to_end(cache_key)
            return cached_result

    result = provider.synthesize(clean_text)
    with TTS_CACHE_LOCK:
        TTS_CACHE[cache_key] = result
        TTS_CACHE.move_to_end(cache_key)
        while len(TTS_CACHE) > TTS_CACHE_MAX_ITEMS:
            TTS_CACHE.popitem(last=False)
    return result
