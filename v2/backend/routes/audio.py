from __future__ import annotations

import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
import time

from fastapi import APIRouter, File, Header, HTTPException, Request, UploadFile
from fastapi.responses import Response

from ..core import config
from ..core.rate_limit import enforce_rate_limit
from ..engine import synthesize_speech, transcribe_audio
from ..schemas import TTSRequest, TranscriptionResponse


logger = logging.getLogger("examiner_victoria")
router = APIRouter(prefix="/api", tags=["audio"])
TTS_EXECUTOR = ThreadPoolExecutor(
    max_workers=config.TTS_EXECUTOR_WORKERS,
    thread_name_prefix="victoria-tts",
)

TRANSCRIPTION_FAILURE_MESSAGE = (
    "Audio transcription is temporarily unavailable. Please switch to Text or try again."
)
TTS_USER_FALLBACK_MESSAGE = "Voice is temporarily unavailable. Continue with the text shown above."


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe(
    request: Request,
    file: UploadFile = File(...),
    content_type: str | None = Header(default=None),
) -> TranscriptionResponse:
    enforce_rate_limit(request)
    audio_bytes = await file.read()
    if len(audio_bytes) < 1024:
        raise HTTPException(
            status_code=400,
            detail="Recording is too short or empty. Please tap again and answer in a complete sentence.",
        )
    if len(audio_bytes) > config.MAX_AUDIO_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                "Audio file is too large. Please record a shorter answer "
                "or lower the upload limit with MAX_AUDIO_UPLOAD_MB."
            ),
        )
    mime_type = file.content_type or content_type or "audio/wav"
    last_error: Exception | None = None
    started_at = time.perf_counter()
    for attempt in range(2):
        try:
            text = await asyncio.to_thread(transcribe_audio, audio_bytes, mime_type)
            break
        except Exception as error:
            last_error = error
            logger.exception(
                "Audio transcription failed: attempt=%s size=%s mime=%s error=%s",
                attempt + 1,
                len(audio_bytes),
                mime_type,
                error,
            )
            if attempt == 0:
                await asyncio.sleep(0.8)
    else:
        raise HTTPException(status_code=502, detail=TRANSCRIPTION_FAILURE_MESSAGE) from last_error
    elapsed_ms = int((time.perf_counter() - started_at) * 1000)
    logger.info(
        "Audio transcription completed: size=%s mime=%s stt_duration_ms=%s",
        len(audio_bytes),
        mime_type,
        elapsed_ms,
    )
    return TranscriptionResponse(text=text, elapsed_ms=elapsed_ms, stt_duration_ms=elapsed_ms)


@router.post("/tts")
async def tts(request_body: TTSRequest, request: Request) -> Response:
    enforce_rate_limit(request)
    text = request_body.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
    if len(text) > config.MAX_TTS_CHARS:
        raise HTTPException(
            status_code=413,
            detail="Voice playback text is too long. Please continue with the visible text.",
        )
    started_at = time.perf_counter()
    try:
        loop = asyncio.get_running_loop()
        result = await asyncio.wait_for(
            loop.run_in_executor(TTS_EXECUTOR, synthesize_speech, text),
            timeout=config.TTS_TIMEOUT_SECONDS,
        )
    except TimeoutError as error:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        logger.warning(
            "TTS synthesis timed out: provider=%s tts_duration_ms=%s chars=%s",
            config.TTS_PROVIDER,
            elapsed_ms,
            len(text),
        )
        raise HTTPException(status_code=504, detail=TTS_USER_FALLBACK_MESSAGE) from error
    except Exception as error:
        elapsed_ms = int((time.perf_counter() - started_at) * 1000)
        logger.warning(
            "TTS synthesis failed: provider=%s tts_duration_ms=%s chars=%s error_type=%s",
            config.TTS_PROVIDER,
            elapsed_ms,
            len(text),
            type(error).__name__,
        )
        raise HTTPException(status_code=502, detail=TTS_USER_FALLBACK_MESSAGE) from error
    elapsed_ms = int((time.perf_counter() - started_at) * 1000)
    logger.info(
        "TTS synthesis completed: provider=%s tts_duration_ms=%s chars=%s bytes=%s request_id=%s",
        result.provider,
        elapsed_ms,
        len(text),
        len(result.audio),
        result.request_id or "",
    )
    return Response(
        content=result.audio,
        media_type=result.content_type,
        headers={"X-TTS-Duration-Ms": str(elapsed_ms)},
    )
