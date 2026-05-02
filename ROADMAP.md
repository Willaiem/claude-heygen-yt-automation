# YouTube Automation Pipeline — Roadmap

> **Keep this file updated.** Mark items as they're completed. This is the single source of truth for project progress.

---

## Architecture

- **Next.js app at root**, Remotion under `src/remotion/` (single `package.json`)
- **Single page UI**: avatar selector + niche dropdown + face upload + multi-URL input + results table
- **Queue-based**: sequential Claude Code CLI spawning, parallel HeyGen polling
- **SSE** for real-time progress
- **Local only** — no auth

**Env keys:** `HEYGEN_COOKIE` (all HeyGen calls use cookie auth on private `api2.heygen.com`), `FAL_KEY` (thumbnail gen via fal.ai `openai/gpt-image-2`), `YOUTUBE_TRANSCRIPT_API_TOKEN`

---

## Pipeline Flow (per URL)

1. Fetch transcript — `youtube-transcript.io` API
2. Fetch competitor thumbnail — `img.youtube.com/vi/{id}/maxresdefault.jpg`
3. Spawn Claude Code CLI — writes ~15k char script + metadata (title, tags, description)
4. Split script — sentence boundaries, max 4,800 chars/scene
5. Submit to HeyGen — per scene: private TTS stream (`api2.heygen.com/v2/online/text_to_speech.stream`) + `POST /v2/avatar/shortcut/submit` with the resulting audio_data (cookie auth)
6. Poll HeyGen — per video_id: queue download via `/v1/pacific/collaboration/video.download`, poll workflow status every 30s until `COMPLETED`
7. Download MP4 — save to `output/videos/`
8. Generate thumbnail — fal.ai `openai/gpt-image-2` with face ref + competitor thumbnail (passed as `image_urls`)
9. SSE updates at each step

---

## Phase 0: Scaffolding

- [x] Move Remotion files to `remotion/` subfolder with own `package.json`
- [x] Initialize Next.js at root (TypeScript, Tailwind, App Router, src dir)
- [x] Create directories: `output/videos/`, `output/thumbnails/`
- [x] Create `.env.local` with placeholder keys
- [x] Update `.gitignore` (`output/`, `.env.local`)
- [x] Define shared types in `src/lib/types.ts`

## Phase 1: UI Shell

- [x] `layout.tsx` — minimal root layout
- [x] `page.tsx` — three-section layout (config bar | URL input | results table)
- [x] `AvatarSelector.tsx` — dropdown, fetches from HeyGen API
- [x] `NicheSelector.tsx` — dropdown (health, politics)
- [x] ~~`FaceUploader.tsx`~~ — **removed in Phase 2**: face image is sourced from the selected HeyGen avatar's `photo_identity_s3_url`, not a user upload
- [x] `UrlInput.tsx` — multi-line textarea + Generate button
- [x] `ResultsTable.tsx` — status, thumbnail preview, copy buttons, download, resubmit

## Phase 2: Foundation API Routes

### HEYGEN API REFERENCE

USE COOKIE FROM ENV - you can get it from any Heygen request body via DevTools or Chrome extension 

- Get selected avatar
```js

// Request
fetch("https://api2.heygen.com/v2/avatar_group/look.list?group_id=3eeae00fccd34f95ae800ef2a2f8d02c&type=all&page=1&limit=20", {
  "headers": {
    "cookie": "<cookies>"
  },
  "method": "GET"
});

// Response
{
    "code": 100,
    "data": {
        "avatar_looks": [
            {
                "look_type": "photo",
                "look": {
                    "look_id": "17ef36ffc11240cca4c3330702eae3a9",
                    "id": "17ef36ffc11240cca4c3330702eae3a9",
                    "image_url": "https://files2.heygen.ai/talking_photo/17ef36ffc11240cca4c3330702eae3a9/c0903ef232f248cd953055274156249c.WEBP?Expires=1777622259&Signature=GKzm2YrapDdL-JKdvOQuL2LfUHGQjeltHTGUCB-0wXZp2V-~5rkk9WyO7wACts9X3DRsYa3tOb7aZtuvfGK62QJIKRb~nvWejhiAe128DedQM1Hk4ulMx-nIU5eBFY-4uB8Cjle6vY8kJjM15GlKjayRqV86W8xb4eh5ISm64JN~3pOQvD~Zp0026jw20Gi9RCCdS~GNSBKbj55~trhHnSeb8nQqlT2NqC75gVqK0Z-6hrO8H-ebzn7THFT6E4EO1GQ8giTuhLnyDGE82zH2tMKlMM3adI945LTfeEpr7EFfK4d-VWTsRWq22au687v0Vd5RwvF~Gagxb-q2hKJIPg__&Key-Pair-Id=K38HBHX5LX3X2H",
                    "image_width": 1792,
                    "image_height": 2368,
                    "circle_box": [
                        0.25195021288735525,
                        0.1429262032379975,
                        0.8114763498306274,
                        0.5663513879518252
                    ],
                    "close_up_box": [
                        0.0,
                        0.09001193175444731,
                        1.0,
                        0.9368623011821026
                    ],
                    "available_style": {
                        "normal": true,
                        "circle": true,
                        "close_up": true
                    },
                    "is_preset": false,
                    "is_valid": true,
                    "has_alpha": false,
                    "created_at": 1777017422.0,
                    "look_name": "News Reporter",
                    "name": "News Reporter",
                    "is_favorite": false,
                    "favorite_updated_at": null,
                    "kit_data": null,
                    "edit_data": null,
                    "acl": null,
                    "default_ac": null,
                    "creator_username": null,
                    "version": "V3",
                    "status": "completed",
                    "is_motion": false,
                    "is_avatar_iv_motion": false,
                    "prompt": "A 28-year-old male journalist in a tailored blazer, standing on a busy city street holding a microphone. He speaks directly to the camera, delivering breaking news with a serious demeanor. Behind him, pedestrians bustle through the street, and a cameraman and news van are visible, adding to the dynamic, on-the-ground setting.",
                    "pack_id": null,
                    "matted_webm_preview_url": null,
                    "motion_preview_url": null,
                    "motion_blurred_lips_mp4_preview_url": null,
                    "motion_blurred_lips_webm_preview_url": null,
                    "business_type": "generated",
                    "group_id": "17ef36ffc11240cca4c3330702eae3a9",
                    "group_name": "News Reporter",
                    "is_shared": false,
                    "voice_config": {
                        "pitch": 0.0,
                        "speed": 1.0,
                        "text": "",
                        "tts_audio_url": "",
                        "tts_duration": 0.0,
                        "voice_gender": "male",
                        "voice_id": "5d8c378ba8c3434586081a52ac368738",
                        "voice_language": "English",
                        "voice_name": "\nMark  ",
                        "provider": "elevenLabs",
                        "elevenlabs_voice_settings": null
                    },
                    "voice_item": null,
                    "upscale_availability": {
                        "available": false,
                        "reason": "The photo avatar look is too large to upscale"
                    },
                    "upscaled": false,
                    "background_sound_effect": null,
                    "fps": null,
                    "support_dynamic_fps": false,
                    "moderation_msg": null,
                    "motion_type": null,
                    "image_to_video_prompt": null,
                    "preferred_orientation": null,
                    "preferred_model": null,
                    "support_avatar_iv": true,
                    "unlimited_mode_disabled": false,
                    "unlimited_mode_disabled_reason": null,
                    "reference_look_id": null,
                    "activated": true,
                    "creation_source": null,
                    "cloned_from_id": null,
                    "generated_model_name": null,
                    "similarity_score": null,
                    "internal_tokyo_version": null,
                    "image_quality_evaluation_workflow_id": null,
                    "has_identity_mismatch": false,
                    "require_sbs_choice": null,
                    "sbs_choices": null
                }
            }
        ],
        "total": 1,
        "page": 1,
        "has_video_and_photo_looks_in_group": false
    },
    "msg": null,
    "message": null
}
```

- Get all avatars
```js
// Request
fetch("https://api2.heygen.com/v2/avatar_group.private.list?limit=10&page=1", {
  "headers": {
   "cookie": "<cookies>"
  },
  "method": "GET"
});

// Response
{
    "code": 100,
    "data": {
        "avatar_groups": [
            {
                "id": "17ef36ffc11240cca4c3330702eae3a9",
                "group_anchor_pose_id": null,
                "num_looks": 1,
                "num_uploaded_looks": 0,
                "is_favorite": false,
                "favorite_updated_at": null,
                "created_at": 1777017422.0,
                "preview_image": "https://files2.heygen.ai/photo_generation/97408a269378487e8794e14c801cf37e/019dbe7d-7778-7263-a59d-8a170f43a09d.jpg?Expires=1777622222&Signature=dusKs5BAeU9VjDGlhXsDYyOit1KOmGt4S3vkRqNuHGdmaroM-0Ls~Gevisdic9Iqfyf1UOqUzLiSOySFJ0wjWHGX4qjTSwEyHAysp20sK7KiNofuJyfKP0TLTN-AwlrDLTaX7izasesHWLNGnwvlLLC0EcQ1TlvStBQpJ5YCG1iIi3EBapi5tQfEMzPNEjdhS7oxFDGOlmqcs7NvaSbTlqXmVoG5rcJCi25kkZcQgBXeAZ6dmw8xFRA0y86aBrWK9WSTSeZ229x1SzZwMyjcXYrK1cwr0LqOl45JXDe0rvEoRMzR0a7FZx-XopOaBi5ItcRfHDDYHIn7yVyw065rWw__&Key-Pair-Id=K38HBHX5LX3X2H",
                "preview_video": null,
                "preferred_orientation": null,
                "name": "News Reporter",
                "tags": [],
                "creator_username": "a120698559534bd4a2b4b8734e76663a",
                "acl": [
                    {
                        "username": "a120698559534bd4a2b4b8734e76663a",
                        "access_type": 7
                    }
                ],
                "default_ac": {
                    "access_type": 7,
                    "overwrite": true
                },
                "slot_index": 1000001,
                "is_public_group": false,
                "is_expired": false,
                "group_type": "GENERATED_PHOTO",
                "created_from_migration": null,
                "created_from_custom_avatar": null,
                "age": "Unspecified",
                "gender": "Unspecified",
                "ethnicity": "Unspecified",
                "avatar_race": null,
                "avatar_style": null,
                "redo_count": 1,
                "redo_reset_ts": 1777593600,
                "error_code": null,
                "detailed_msg": null,
                "avatar_type": null,
                "default_voice_id": "5d8c378ba8c3434586081a52ac368738",
                "is_premium": false,
                "meta_data": {
                    "video_dict": null,
                    "consent_video_dict": null,
                    "created_by_migration": null,
                    "custom_avatar": null,
                    "is_public_avatar_kit": null,
                    "footage_sync_score": null,
                    "consent_sync_score": null,
                    "group_type": "GENERATED_PHOTO",
                    "migration_version": null,
                    "disable_automoderation": null,
                    "gender": "Unspecified",
                    "age": "Unspecified",
                    "ethnicity": "Unspecified",
                    "from_api": false,
                    "video_avatar_creation_disabled": true,
                    "tags": null,
                    "public_avatar_type": null,
                    "creation_type": "insert",
                    "deletion_type": "user_deletion",
                    "footage_upgradable": false
                },
                "community_moderation_meta": null,
                "creator_name": null,
                "verification_status": null,
                "video_identity_s3_url": null,
                "photo_identity_s3_url": "https://files2.heygen.ai/photo_generation/97408a269378487e8794e14c801cf37e/019dbe7d-7778-7263-a59d-8a170f43a09d.jpg?Expires=1777622222&Signature=dusKs5BAeU9VjDGlhXsDYyOit1KOmGt4S3vkRqNuHGdmaroM-0Ls~Gevisdic9Iqfyf1UOqUzLiSOySFJ0wjWHGX4qjTSwEyHAysp20sK7KiNofuJyfKP0TLTN-AwlrDLTaX7izasesHWLNGnwvlLLC0EcQ1TlvStBQpJ5YCG1iIi3EBapi5tQfEMzPNEjdhS7oxFDGOlmqcs7NvaSbTlqXmVoG5rcJCi25kkZcQgBXeAZ6dmw8xFRA0y86aBrWK9WSTSeZ229x1SzZwMyjcXYrK1cwr0LqOl45JXDe0rvEoRMzR0a7FZx-XopOaBi5ItcRfHDDYHIn7yVyw065rWw__&Key-Pair-Id=K38HBHX5LX3X2H",
                "train_status": null,
                "train_status_error_msg": null,
                "moderation_msg": null,
                "train_workflow_id": null,
                "phota_ready": false,
                "phota_training": false,
                "phota_train_length": 0,
                "phota_trained_ids": null,
                "pack_id": null,
                "is_shared": false,
                "spaces_or_users_shared_to": {},
                "footage_upgradable": false,
                "has_studio_avatar": null
            },
            {
                "id": "3eeae00fccd34f95ae800ef2a2f8d02c",
                "group_anchor_pose_id": null,
                "num_looks": 1,
                "num_uploaded_looks": 0,
                "is_favorite": false,
                "favorite_updated_at": null,
                "created_at": 1776619634.0,
                "preview_image": "https://files2.heygen.ai/photo_generation/ea37a1ae28e54af4a8f337498a8fc1d4/019da6c7-b075-7973-9070-6e3a2df3eda2.jpg?Expires=1777224434&Signature=e~hLypdICo91W5qaDDUdKc880z9SQb7RrPmOuNzbJEkHIw~TmpKK8O~TPYFe29vXTnfK3795VxbnAbSY37RhkwLBq77uQzNm3JQY60y-LCRkbqa5-knymdxGBm9m0BX7-fJfusvNLe6fWljwhdxp83KhwLpqV8UmaBSFusd-CDXVqTVzXck7niOeOKlYsWanC9BaKQXXYiDG7JBz5trHMRUNv6Pg8HmsTgq~06oqHQdOC8CGVWqxdjld1pb0ok3wSYOPfc88qTBue8zF0ItqFdCUCE9TrTb4BE0fnj14AyVcUoWEPvUKbf5hBfS7VMOW3gFW1HaHNZv4oLLmdg2X7A__&Key-Pair-Id=K38HBHX5LX3X2H",
                "preview_video": null,
                "preferred_orientation": null,
                "name": "Dr Julian K",
                "tags": [],
                "creator_username": "a120698559534bd4a2b4b8734e76663a",
                "acl": [
                    {
                        "username": "a120698559534bd4a2b4b8734e76663a",
                        "access_type": 7
                    }
                ],
                "default_ac": {
                    "access_type": 7,
                    "overwrite": true
                },
                "slot_index": 1000000,
                "is_public_group": false,
                "is_expired": false,
                "group_type": "GENERATED_PHOTO",
                "created_from_migration": null,
                "created_from_custom_avatar": null,
                "age": "Late Middle Age",
                "gender": "Man",
                "ethnicity": "White",
                "avatar_race": null,
                "avatar_style": null,
                "redo_count": 1,
                "redo_reset_ts": 1777593600,
                "error_code": null,
                "detailed_msg": null,
                "avatar_type": null,
                "default_voice_id": "1LtsDD7yfTuX92TzjmJk",
                "is_premium": false,
                "meta_data": {
                    "video_dict": null,
                    "consent_video_dict": null,
                    "created_by_migration": null,
                    "custom_avatar": null,
                    "is_public_avatar_kit": null,
                    "footage_sync_score": null,
                    "consent_sync_score": null,
                    "group_type": "GENERATED_PHOTO",
                    "migration_version": null,
                    "disable_automoderation": null,
                    "gender": "Man",
                    "age": "Late Middle Age",
                    "ethnicity": "White",
                    "from_api": false,
                    "video_avatar_creation_disabled": true,
                    "tags": null,
                    "public_avatar_type": null,
                    "creation_type": "insert",
                    "deletion_type": "user_deletion",
                    "footage_upgradable": false
                },
                "community_moderation_meta": null,
                "creator_name": null,
                "verification_status": null,
                "video_identity_s3_url": null,
                "photo_identity_s3_url": "https://files2.heygen.ai/photo_generation/ea37a1ae28e54af4a8f337498a8fc1d4/019da6c7-b075-7973-9070-6e3a2df3eda2.jpg?Expires=1777224434&Signature=e~hLypdICo91W5qaDDUdKc880z9SQb7RrPmOuNzbJEkHIw~TmpKK8O~TPYFe29vXTnfK3795VxbnAbSY37RhkwLBq77uQzNm3JQY60y-LCRkbqa5-knymdxGBm9m0BX7-fJfusvNLe6fWljwhdxp83KhwLpqV8UmaBSFusd-CDXVqTVzXck7niOeOKlYsWanC9BaKQXXYiDG7JBz5trHMRUNv6Pg8HmsTgq~06oqHQdOC8CGVWqxdjld1pb0ok3wSYOPfc88qTBue8zF0ItqFdCUCE9TrTb4BE0fnj14AyVcUoWEPvUKbf5hBfS7VMOW3gFW1HaHNZv4oLLmdg2X7A__&Key-Pair-Id=K38HBHX5LX3X2H",
                "train_status": null,
                "train_status_error_msg": null,
                "moderation_msg": null,
                "train_workflow_id": null,
                "phota_ready": false,
                "phota_training": false,
                "phota_train_length": 0,
                "phota_trained_ids": null,
                "pack_id": null,
                "is_shared": false,
                "spaces_or_users_shared_to": {},
                "footage_upgradable": false,
                "has_studio_avatar": null
            }
        ],
        "page": 1,
        "total": 2,
        "current_page_actual_total": 2,
        "remaining_slots": 5,
        "total_slots": 5
    },
    "msg": null,
    "message": null
}
```

- Queue text to speech generation
```js
fetch("https://api2.heygen.com/v2/online/text_to_speech.stream", {
  "headers": {
    "cookie": "<cookies>"
  },
  "body": "{\"text_type\":\"ssml\",\"text\":\"<speak><voice name=\\\"5d8c378ba8c3434586081a52ac368738\\\"><prosody rate=\\\"1\\\" pitch=\\\"0%\\\">latwogang is doing amazing charity stream everybody give the money hehe iksde zostalemzmuszonyslyszalesjestemzmuszonymniejszewiekszemniejszewieksze</prosody></voice></speak>\",\"voice_id\":\"5d8c378ba8c3434586081a52ac368738\",\"settings\":{\"voice_engine_settings\":{\"engine_type\":\"elevenLabsV3\",\"stability\":1}},\"voice_engine\":\"elevenLabsV3\"}",
  "method": "POST"
});

{"audio_url":null,"audio_bytes":"...","auto_engine":null,"sequence_number":6,"duration":6.593000000000001,"format":"mp3","word_timestamps":[{"word":"nots","start":6.24,"end":6.64}],"request_id":"XerxL5ZABJyWekZ3HxFQ"}
{"audio_url":null,"audio_bytes":"...","auto_engine":null,"sequence_number":7,"duration":6.619125000000001,"format":"mp3","word_timestamps":null,"request_id":"XerxL5ZABJyWekZ3HxFQ"}
{"audio_url":null,"audio_bytes":"...","auto_engine":null,"sequence_number":8,"duration":6.687343750000001,"format":"mp3","word_timestamps":null,"request_id":"XerxL5ZABJyWekZ3HxFQ"}
{"audio_url":null,"audio_bytes":"","auto_engine":null,"sequence_number":9,"duration":6.6873469387755105,"format":"mp3","word_timestamps":[{"word":"<end>","start":6.6873469387755105,"end":6.6873469387755105}],"request_id":"XerxL5ZABJyWekZ3HxFQ"}
{"audio_url":"https://resource2.heygen.ai/text_to_speech/a120698559534bd4a2b4b8734e76663a/5d8c378ba8c3434586081a52ac368738/id=e7e77104-b565-4d2e-b804-ab1f9d4013f7.wav","audio_bytes":"","auto_engine":null,"sequence_number":-1,"duration":6.6873469387755105,"format":"mp3","word_timestamps":null,"request_id":"XerxL5ZABJyWekZ3HxFQ"}

```


- Queue video generation

```js
fetch("https://api2.heygen.com/v2/avatar/shortcut/submit", {
  "headers": {
    "cookie": "<cookies>"
  },
  "body": "{\"video_title\":\"Avatar Video\",\"video_orientation\":\"portrait\",\"resolution\":\"720p\",\"avatar_id\":\"17ef36ffc11240cca4c3330702eae3a9\",\"source_type\":\"avatar_video_shortcut_modal\",\"fit\":\"cover\",\"audio_data\":{\"audio_type\":\"tts\",\"audio_url\":\"https://resource2.heygen.ai/text_to_speech/a120698559534bd4a2b4b8734e76663a/5d8c378ba8c3434586081a52ac368738/id=e7e77104-b565-4d2e-b804-ab1f9d4013f7.wav\",\"duration\":6.6873469387755105,\"words\":[{\"word\":\"<start>\",\"start_time\":0,\"end_time\":0},{\"word\":\"yebać\",\"start_time\":0,\"end_time\":0.4},{\"word\":\"disa\",\"start_time\":0.46,\"end_time\":0.72},{\"word\":\"orka\",\"start_time\":0.827,\"end_time\":1.201},{\"word\":\"skurczysyna\",\"start_time\":1.494,\"end_time\":2.721},{\"word\":\"jojojojojojojo\",\"start_time\":2.8810000000000002,\"end_time\":4.401},{\"word\":\"ciomkam\",\"start_time\":4.614,\"end_time\":5.359999999999999},{\"word\":\"locka\",\"start_time\":5.4239999999999995,\"end_time\":5.76},{\"word\":\"calom\",\"start_time\":5.82,\"end_time\":6.16},{\"word\":\"nots\",\"start_time\":6.24,\"end_time\":6.64},{\"word\":\"<end>\",\"start_time\":6.6873469387755105,\"end_time\":6.6873469387755105}],\"text\":\"yebać disa orka skurczysyna jojojojojojojo ciomkam locka calom nots\",\"voice_id\":\"5d8c378ba8c3434586081a52ac368738\"},\"avatar_settings\":{\"use_avatar_iv_model\":false,\"use_unlimited_mode\":true},\"enable_caption\":false,\"create_new_avatar\":false}",
  "method": "POST"
});

{"code":100,"data":{"video_id":"1fd8b231018c40a2ba98e414b0cd1082","avatar_id":"17ef36ffc11240cca4c3330702eae3a9"},"msg":null,"message":null}
```


- Get last used avatar
```js
fetch("https://api2.heygen.com/v1/avatar_group/recently_used.list", {
  "headers": {
    "cookie": "<cookies>"
  },
  "method": "GET"
});

{"code":100,"data":{"avatar_groups":[{"id":"17ef36ffc11240cca4c3330702eae3a9","group_anchor_pose_id":null,"num_looks":1,"num_uploaded_looks":0,"is_favorite":false,"favorite_updated_at":null,"created_at":1777017422.0,"preview_image":"https://files2.heygen.ai/photo_generation/97408a269378487e8794e14c801cf37e/019dbe7d-7778-7263-a59d-8a170f43a09d.jpg?Expires=1777622222&Signature=dusKs5BAeU9VjDGlhXsDYyOit1KOmGt4S3vkRqNuHGdmaroM-0Ls~Gevisdic9Iqfyf1UOqUzLiSOySFJ0wjWHGX4qjTSwEyHAysp20sK7KiNofuJyfKP0TLTN-AwlrDLTaX7izasesHWLNGnwvlLLC0EcQ1TlvStBQpJ5YCG1iIi3EBapi5tQfEMzPNEjdhS7oxFDGOlmqcs7NvaSbTlqXmVoG5rcJCi25kkZcQgBXeAZ6dmw8xFRA0y86aBrWK9WSTSeZ229x1SzZwMyjcXYrK1cwr0LqOl45JXDe0rvEoRMzR0a7FZx-XopOaBi5ItcRfHDDYHIn7yVyw065rWw__&Key-Pair-Id=K38HBHX5LX3X2H","preview_video":null,"preferred_orientation":null,"name":"News Reporter","tags":[],"creator_username":"a120698559534bd4a2b4b8734e76663a","acl":[{"username":"a120698559534bd4a2b4b8734e76663a","access_type":7}],"default_ac":{"access_type":7,"overwrite":true},"slot_index":1000001,"is_public_group":false,"is_expired":false,"group_type":"GENERATED_PHOTO","created_from_migration":null,"created_from_custom_avatar":null,"age":"Unspecified","gender":"Unspecified","ethnicity":"Unspecified","avatar_race":null,"avatar_style":null,"redo_count":1,"redo_reset_ts":1777593600,"error_code":null,"detailed_msg":null,"avatar_type":null,"default_voice_id":"5d8c378ba8c3434586081a52ac368738","is_premium":false,"meta_data":{"video_dict":null,"consent_video_dict":null,"created_by_migration":null,"custom_avatar":null,"is_public_avatar_kit":null,"footage_sync_score":null,"consent_sync_score":null,"group_type":"GENERATED_PHOTO","migration_version":null,"disable_automoderation":null,"gender":"Unspecified","age":"Unspecified","ethnicity":"Unspecified","from_api":false,"video_avatar_creation_disabled":true,"tags":null,"public_avatar_type":null,"creation_type":"insert","deletion_type":"user_deletion","footage_upgradable":false},"community_moderation_meta":null,"creator_name":null,"verification_status":null,"video_identity_s3_url":null,"photo_identity_s3_url":"https://files2.heygen.ai/photo_generation/97408a269378487e8794e14c801cf37e/019dbe7d-7778-7263-a59d-8a170f43a09d.jpg?Expires=1777622222&Signature=dusKs5BAeU9VjDGlhXsDYyOit1KOmGt4S3vkRqNuHGdmaroM-0Ls~Gevisdic9Iqfyf1UOqUzLiSOySFJ0wjWHGX4qjTSwEyHAysp20sK7KiNofuJyfKP0TLTN-AwlrDLTaX7izasesHWLNGnwvlLLC0EcQ1TlvStBQpJ5YCG1iIi3EBapi5tQfEMzPNEjdhS7oxFDGOlmqcs7NvaSbTlqXmVoG5rcJCi25kkZcQgBXeAZ6dmw8xFRA0y86aBrWK9WSTSeZ229x1SzZwMyjcXYrK1cwr0LqOl45JXDe0rvEoRMzR0a7FZx-XopOaBi5ItcRfHDDYHIn7yVyw065rWw__&Key-Pair-Id=K38HBHX5LX3X2H","train_status":null,"train_status_error_msg":null,"moderation_msg":null,"train_workflow_id":null,"phota_ready":false,"phota_training":false,"phota_train_length":0,"phota_trained_ids":null,"pack_id":null,"is_shared":false,"spaces_or_users_shared_to":{},"footage_upgradable":false,"has_studio_avatar":null},{"id":"3eeae00fccd34f95ae800ef2a2f8d02c","group_anchor_pose_id":null,"num_looks":1,"num_uploaded_looks":0,"is_favorite":false,"favorite_updated_at":null,"created_at":1776619634.0,"preview_image":"https://files2.heygen.ai/photo_generation/ea37a1ae28e54af4a8f337498a8fc1d4/019da6c7-b075-7973-9070-6e3a2df3eda2.jpg?Expires=1777224434&Signature=e~hLypdICo91W5qaDDUdKc880z9SQb7RrPmOuNzbJEkHIw~TmpKK8O~TPYFe29vXTnfK3795VxbnAbSY37RhkwLBq77uQzNm3JQY60y-LCRkbqa5-knymdxGBm9m0BX7-fJfusvNLe6fWljwhdxp83KhwLpqV8UmaBSFusd-CDXVqTVzXck7niOeOKlYsWanC9BaKQXXYiDG7JBz5trHMRUNv6Pg8HmsTgq~06oqHQdOC8CGVWqxdjld1pb0ok3wSYOPfc88qTBue8zF0ItqFdCUCE9TrTb4BE0fnj14AyVcUoWEPvUKbf5hBfS7VMOW3gFW1HaHNZv4oLLmdg2X7A__&Key-Pair-Id=K38HBHX5LX3X2H","preview_video":null,"preferred_orientation":null,"name":"Dr Julian K","tags":[],"creator_username":"a120698559534bd4a2b4b8734e76663a","acl":[{"username":"a120698559534bd4a2b4b8734e76663a","access_type":7}],"default_ac":{"access_type":7,"overwrite":true},"slot_index":1000000,"is_public_group":false,"is_expired":false,"group_type":"GENERATED_PHOTO","created_from_migration":null,"created_from_custom_avatar":null,"age":"Late Middle Age","gender":"Man","ethnicity":"White","avatar_race":null,"avatar_style":null,"redo_count":1,"redo_reset_ts":1777593600,"error_code":null,"detailed_msg":null,"avatar_type":null,"default_voice_id":"1LtsDD7yfTuX92TzjmJk","is_premium":false,"meta_data":{"video_dict":null,"consent_video_dict":null,"created_by_migration":null,"custom_avatar":null,"is_public_avatar_kit":null,"footage_sync_score":null,"consent_sync_score":null,"group_type":"GENERATED_PHOTO","migration_version":null,"disable_automoderation":null,"gender":"Man","age":"Late Middle Age","ethnicity":"White","from_api":false,"video_avatar_creation_disabled":true,"tags":null,"public_avatar_type":null,"creation_type":"insert","deletion_type":"user_deletion","footage_upgradable":false},"community_moderation_meta":null,"creator_name":null,"verification_status":null,"video_identity_s3_url":null,"photo_identity_s3_url":"https://files2.heygen.ai/photo_generation/ea37a1ae28e54af4a8f337498a8fc1d4/019da6c7-b075-7973-9070-6e3a2df3eda2.jpg?Expires=1777224434&Signature=e~hLypdICo91W5qaDDUdKc880z9SQb7RrPmOuNzbJEkHIw~TmpKK8O~TPYFe29vXTnfK3795VxbnAbSY37RhkwLBq77uQzNm3JQY60y-LCRkbqa5-knymdxGBm9m0BX7-fJfusvNLe6fWljwhdxp83KhwLpqV8UmaBSFusd-CDXVqTVzXck7niOeOKlYsWanC9BaKQXXYiDG7JBz5trHMRUNv6Pg8HmsTgq~06oqHQdOC8CGVWqxdjld1pb0ok3wSYOPfc88qTBue8zF0ItqFdCUCE9TrTb4BE0fnj14AyVcUoWEPvUKbf5hBfS7VMOW3gFW1HaHNZv4oLLmdg2X7A__&Key-Pair-Id=K38HBHX5LX3X2H","train_status":null,"train_status_error_msg":null,"moderation_msg":null,"train_workflow_id":null,"phota_ready":false,"phota_training":false,"phota_train_length":0,"phota_trained_ids":null,"pack_id":null,"is_shared":false,"spaces_or_users_shared_to":{},"footage_upgradable":false,"has_studio_avatar":null}],"page":1,"total":2,"current_page_actual_total":2,"remaining_slots":0,"total_slots":0},"msg":null,"message":null}
```

- Queue video download
```js
fetch("https://api2.heygen.com/v1/pacific/collaboration/video.download", {
  "headers": {
    "cookie": "<cookies>"
  },
  "body": "{\"video_id\":\"7bf5a2b8854e43ba9aa52ac1a251ba4c\",\"resolution\":\"1080p\",\"resource_type\":\"heygen_video\",\"with_captions\":false}",
  "method": "POST"
});

{"code":100,"data":{"workflow_id":"7bf5a2b8854e43ba9aa52ac1a251ba4c-e793c09e-a6ea-46b0-96a1-ed9dfe24298a_1080p_nocap","status":"SCHEDULED","download_url":null},"msg":null,"message":null}
```

- Polling video download
```js
// Request
fetch("https://api2.heygen.com/v1/pacific/collaboration/video.download/status?workflow_id=7bf5a2b8854e43ba9aa52ac1a251ba4c-e793c09e-a6ea-46b0-96a1-ed9dfe24298a_1080p_nocap", {
  "headers": {
    "cookie": "<cookies>"
  },
  "method": "GET"
});

// Responses

{"code":100,"data":{"workflow_id":"7bf5a2b8854e43ba9aa52ac1a251ba4c-e793c09e-a6ea-46b0-96a1-ed9dfe24298a_1080p_nocap","status":"RUNNING","download_url":null},"msg":null,"message":null}
{"code":100,"data":{"workflow_id":"7bf5a2b8854e43ba9aa52ac1a251ba4c-e793c09e-a6ea-46b0-96a1-ed9dfe24298a_1080p_nocap","status":"COMPLETED","download_url":"https://resource2.heygen.ai/video/transcode/7bf5a2b8854e43ba9aa52ac1a251ba4c/ve793c09e-a6ea-46b0-96a1-ed9dfe24298a/720x1280_nocap.mp4?response-content-disposition=attachment%3B+filename%2A%3DUTF-8%27%27Avatar%2520Video_1080p.mp4%3B"},"msg":null,"message":null}
```

- [x] `getAvatars()` server action (`src/app/actions.ts`) — fetches `api2.heygen.com/v2/avatar_group.private.list` (cookie auth), parses + camelCases via a zod schema with `.transform()` (snake_case → `HeyGenAvatar` DTO, `faceImageUrl` from `photo_identity_s3_url`), caches via `globalThis` with 5-minute TTL (signed S3 URLs). **Server actions preferred over route handlers** for RPC-style calls; route handlers reserved for streaming (SSE) and binary responses.
- [x] Wire `AvatarSelector` to `getAvatars()` action
- ~~`POST /api/upload-face` — multipart form → `public/references/`~~ **REMOVED**: face image is read off the selected avatar's `photo_identity_s3_url`, no user upload needed
- ~~Wire `FaceUploader` to `/api/upload-face`~~ **REMOVED** with the uploader

## Phase 3: Pipeline Modules

- [x] `src/lib/pipeline/fetch-transcript.ts` — POST to `youtube-transcript.io/api/transcripts` (Basic auth via `YOUTUBE_TRANSCRIPT_API_TOKEN`, joins transcript segments into plain text)
- [x] `src/lib/pipeline/fetch-competitor-thumb.ts` — download from `img.youtube.com` (falls back `maxresdefault` → `hqdefault` → `mqdefault`), saves to `output/thumbnails/competitor_{videoId}.jpg`. Returns `{ path, url }` — the path is kept for downstream use (Remotion / debugging), the URL is what fal.ai's `image_urls[]` consumes directly so no re-upload is needed.
- [x] `src/lib/pipeline/spawn-claude.ts` — `child_process.spawn("claude", ["-p", "--output-format", "json"])` with `shell: true` (Windows), prompt piped via stdin, strips markdown fences, parses `{ script, title, tags, description }` via zod
- [x] `src/lib/pipeline/split-scenes.ts` — sentence-boundary splitter, `HEYGEN_SCENE_CHAR_LIMIT = 4800`; hard-splits any single sentence longer than the limit
- [x] `src/lib/pipeline/heygen-submit.ts` — **cookie-authed** against `api2.heygen.com`; per scene: `POST /v2/online/text_to_speech.stream` (reads NDJSON until `sequence_number: -1`, collects `audio_url` + aggregated `word_timestamps`) then `POST /v2/avatar/shortcut/submit` with the `audio_data` (landscape, 720p); returns `string[]` of `video_id` (one per scene)
- [x] `src/lib/pipeline/heygen-poll.ts` — **cookie-authed**; per video_id: `POST /v1/pacific/collaboration/video.download` → workflow_id, then 30s polling of `/v1/pacific/collaboration/video.download/status` until `COMPLETED`/`FAILED`, 30-min hard cap, `onTick(videoId, status)` callback; polls all video_ids in parallel; returns `string[]` of `download_url`
- [x] `src/lib/pipeline/download-video.ts` — streams MP4 via `Readable.fromWeb` + `pipeline` → `output/videos/{videoId}.mp4`
- [x] `src/lib/pipeline/generate-thumbnail.ts` — fal.ai `openai/gpt-image-2` via sync REST (`POST https://fal.run/openai/gpt-image-2`, `Authorization: Key $FAL_KEY`). Body: `{ prompt, image_urls: [faceImageUrl, competitorThumbUrl], image_size: { width: 1536, height: 1024 }, quality: "high", output_format: "png", num_images: 1 }`. Both inputs are public URLs (HeyGen face S3 + YouTube `img.youtube.com` thumb), so no fal-storage upload needed. Streams the returned signed URL to `output/thumbnails/{videoId}.png`. **Was previously OpenAI `images/edits` with `gpt-image-1`; switched away because OpenAI's `images/edits` charge added up and a brief detour through ChatGPT's private `/f/conversation` API was abandoned (see Key Decisions).**
- [x] `src/lib/niches.ts` — `NICHES` array of `NicheConfig` (health, politics) parsed through `NicheConfigSchema`; `getNiche(id)` helper throws on unknown id

## Phase 4: Queue + Orchestration

- [x] `src/lib/queue.ts` — in-memory `JobQueue` (EventEmitter on `globalThis` singleton). Per-job pipeline runner wired through transcript → competitor thumb → Claude → split scenes → submit → poll → download → thumbnail, emitting `job_update` on every state change and `batch_complete` when the batch drains. **Sequential Claude gating** via a shared promise chain (`claudeChain`) that serializes `spawnClaude` calls across all in-flight jobs; the chain swallows its own rejections so one CLI failure doesn't poison subsequent spawns. HeyGen polling stays parallel (each job's `pollHeyGen` walks its own scenes via `Promise.all`).
- [x] `generate()` server action — accepts `{ urls[], avatarId, voiceId, niche, faceImageUrl }` (validated via `GenerateRequestSchema`), creates a batch, kicks off processing, returns `{ batchId, jobs }`.
- [x] `GET /api/progress` — SSE route handler. Validates `?batchId=`, sends an initial snapshot of every job, subscribes to queue events filtered by `batchId`, and unsubscribes on `batch_complete` or `request.signal` abort. `runtime = "nodejs"`, `dynamic = "force-dynamic"`.
- [x] Schema update (was singular, now plural — reflects per-scene truth): `Job.heygenVideoId` → `heygenVideoIds: string[]`; `Job.videoPath` → `videoPaths: string[]`. `ResultsTable` renders one Download button for `videoPaths[0]` (labels as `(1/N)` when multi-scene; concatenation is deferred to Remotion).
- [x] `src/lib/youtube.ts` — `parseYouTubeUrl()` (handles `watch?v=`, `youtu.be/`, `shorts/`, `embed/`, `live/`, and bare 11-char ids). **Moved up from Phase 6** — the queue needs it to derive `videoId` from each submitted URL.

## Phase 5: Wire Frontend

- [x] `src/hooks/useSSE.ts` — `EventSource` wrapper hook; takes `(batchId, initialJobs)`, resets state when `batchId` changes, parses events through `SSEEventSchema`, merges `job_update` patches onto the local jobs array, closes on `batch_complete`.
- [x] Connect Generate button → `generate()` action — `page.tsx` now holds `batchId` + `seedJobs` state, calls the action, seeds jobs with `progress: 0`, and derives `isRunning` from `useSSE` to disable the button while a batch is in flight. Inline error surfaced under the URL input on action throw.
- [x] Connect `ResultsTable` to SSE progress stream — `page.tsx` passes `useSSE`'s live `jobs` array straight into `ResultsTable`.
- [x] Copy-to-clipboard for title, tags, description — already in `ResultsTable` from Phase 1.
- [x] Download links for MP4s — `ResultsTable` now links to `/api/file?path=…&download=1`.
- [x] Thumbnail previews in results table — `ResultsTable` `<img src>` now goes through `/api/file?path=…` (inline, no `download=1`).
- [x] `src/app/api/file/route.ts` — generic file server for anything under `output/`. Added instead of the originally planned `api/download-video/route.ts` because thumbnails live in `output/thumbnails/` too and needed HTTP access. Directory-traversal protection via `path.relative(OUTPUT_DIR, absolute)`; content-type by extension (`.mp4`, `.png`, `.jpg`, `.webp`); `download=1` query flips to `Content-Disposition: attachment`.

## Phase 6: Polish

- [x] `resubmit()` server action — thin wrapper over `queue.resubmitJob(batchId, jobId)`. `resubmitJob` now also re-emits `batch_complete` once the retried job settles, so the SSE stream closes cleanly after a retry. The frontend bumps a `subscriptionKey` on retry to reopen the EventSource (which had been closed by the prior `batch_complete`); the route's snapshot loop replays current state on reconnect.
- [x] Error states and loading indicators — `ResultsTable` shows the per-job `error` message under the failed status and a Retry button that disables to "Retrying…" while the action is in flight; running jobs show a `progress%` next to the step label. Generate button label flips to `Submitting…` / `Running…` based on `isSubmitting` and `isRunning`.
- [x] ~~YouTube URL parsing utility~~ — landed in Phase 4 as `src/lib/youtube.ts`

## Phase 7: Remotion post-processing — stitched final + AI-generated infographic slides

Today the pipeline ends with N per-scene MP4s + a thumbnail. Phase 7 extends every job with a single 1920×1080 final MP4 that stitches the scenes back-to-back via Remotion `<Sequence>` and overlays AI-generated infographic slides timed to the avatar's speech. Auto-runs at the end of every job; gracefully degrades when sub-steps fail.

### Architecture decisions

- **Aspect ratio:** 1920×1080, 30fps, H.264 CRF 18.
- **Layout:** avatar full-frame default; per-slide cutaway either shrinks the avatar to a top-right circle PIP (~18% width) or hides it (cover). Default per slide type, planner can override per slide.
- **Slide source:** separate Claude planner pass — does NOT modify the existing script-generation prompt.
- **Slide catalog (7 types):** `title`, `bullets`, `stat`, `diagram` (one large illustration + callouts), `steps` (3-panel flow with arrows, defaults to PIP), `warning_grid` (4-panel, defaults to cover), `action_grid` (5–6 numbered panels, defaults to cover).
- **Image generation:** fal.ai `openai/gpt-image-2` text-to-image (NOT edit mode). Planner emits image prompts inline. `diagram`: 1536×1024. All grid panels: 1024×1024.
- **Slide timing:** planner emits `{ startPhrase, end: { kind: "phrase", phrase } | { kind: "hold", seconds } }`. New module fuzzy-matches against `word_timestamps` (currently discarded inside `heygen-submit.ts` — must be persisted) to resolve frames.
- **Stitching:** native Remotion `<Sequence>` per scene, no ffmpeg.
- **Render integration:** programmatic SSR via `@remotion/bundler` + `@remotion/renderer`; bundle cached on `globalThis`; `onProgress` → SSE.
- **Project layout:** consolidate — move `remotion/` into `src/remotion/`, single root `package.json`, single `node_modules`.
- **Failure isolation:** planner failure → bare-stitched fallback; image-gen partial failure → hard fail; editing failure → `editing_failed` step with per-scene MP4s still exposed and a `Re-edit` button.
- **Style:** single unified theme for v1 (health-style palette). Per-niche theming deferred.
- **Polish v1 defaults:** hard cuts between scenes; per-slide 200ms fade+slide-up enter / 150ms fade-out exit; no burned captions, music, or intro/outro.

### Pipeline flow (revised)

`PipelineStepSchema` gains the entries marked `(new)`:

```
queued
fetching_transcript
fetching_thumbnail
generating_script
splitting_scenes
submitting_heygen          ← also captures sceneWords (was discarded)
─── fork ───────────────────────────────────────────────────────────
  Branch A:                       │   Branch B (new, parallel):
    polling_heygen                │     planning_slides       (new, gated on claudeChain)
    downloading_video             │     generating_slide_images (new, fal.ai parallel)
    generating_thumbnail          │
─── join ───────────────────────────────────────────────────────────
resolving_slide_timing     (new)
editing                    (new) ← Remotion programmatic render
completed
slides_failed              (new) ← planner failed → bare-stitched fallback
editing_failed             (new) ← Remotion failed → per-scene MP4s usable; reedit() retries
failed
```

Branch B finishes inside HeyGen's 5–10 min poll window, so wall-clock cost over current pipeline is ~zero.

### 7.0 — Project consolidation (one-time refactor)

- [x] `git mv remotion/src/* src/remotion/` (preserves HelloWorld scaffolding temporarily as a smoke test)
- [x] `git mv remotion/remotion.config.ts src/remotion/`
- [x] Merge Remotion deps into root `package.json` at version 4.0.451: `remotion`, `@remotion/cli`, `@remotion/zod-types`, `@remotion/tailwind-v4`, `@remotion/bundler`, `@remotion/renderer`. Reconcile React (root 19.1 vs remotion 19.2.3) and Tailwind (root 4.1.4 vs remotion 4.0.0) — bumped root React to 19.2.3 / left Tailwind at 4.1.4
- [x] Delete `remotion/` folder (all of `node_modules/`, `package.json`, `package-lock.json`, `.prettierrc`, `eslint.config.mjs`, `tsconfig.json`)
- [x] Drop `"remotion"` from `tsconfig.json` excludes
- [x] `next.config.ts` — added `serverExternalPackages: ['@remotion/bundler', '@remotion/renderer', 'remotion']`
- [x] Added npm scripts `remotion:studio` / `remotion:bundle` (with `--config src/remotion/remotion.config.ts` since the config moved out of project root). `next lint` already covers `src/remotion/`, so no separate Remotion lint script.
- [x] Updated `CLAUDE.md` (Commands section is now "Single Node package") and `README.md` (Tech Stack, Project Structure, Remotion section)
- [x] Verify: `npm install` clean (184 packages added), `npx tsc --noEmit` passes, `npm run remotion:studio` builds in ~7s and serves on localhost:3001, `npm run dev` ready in 1.7s on localhost:3000

### 7.1 — Schema additions (`src/lib/types.ts`)

- [ ] `WordTimestampSchema` — `{ word, start, end }`
- [ ] Extend `JobSchema`: `sceneWords?: WordTimestamp[][]`, `slidePlan?: SlidePlan`, `slideImagePaths?: string[][]`, `finalVideoPath?: string`, `editError?: string`
- [ ] Extend `PipelineStepSchema`: `planning_slides`, `generating_slide_images`, `resolving_slide_timing`, `editing`, `slides_failed`, `editing_failed`
- [ ] `SlideSchema` — discriminated union over the 7 slide types. Each variant extends `SlideBaseSchema` with `{ id, startPhrase, end: ({kind:"phrase", phrase} | {kind:"hold", seconds}), layout?: "pip"|"cover" }`. Per-type props: title `{ text, subtitle? }`; bullets `{ heading?, bullets[1..5] }`; stat `{ value, label }`; diagram `{ title, subtitle?, imagePrompt, callouts[], bottomCaption? }`; steps `{ title, subtitle?, steps[3]: { imagePrompt, label, caption }, footerCaption? }`; warning_grid `{ title, subtitle?, panels[4]: { imagePrompt, label, caption, boldFooter? }, footerBanner?, bottomCaption? }`; action_grid `{ title, subtitle?, actions[5..6]: { number, imagePrompt, label, description }, bottomCaption? }`
- [ ] `SlidePlanSchema` — `{ scenes: { sceneIndex, slides: Slide[].max(8) }[] }`
- [ ] `JobRenderPropsSchema` — fully resolved input bundle for Remotion: per-scene `{ videoUrl, durationSec, slides: Array<{ ...slideProps, startFrame, endFrame, layout, resolvedImagePaths? }> }`

### 7.2 — Surface `sceneWords` from HeyGen submit

- [ ] `src/lib/pipeline/heygen-submit.ts` — change return type to `Promise<{ videoIds: string[]; sceneWords: WordTimestamp[][] }>`. The `generateTts` function already collects `word_timestamps`; just plumb them up
- [ ] `src/lib/queue.ts` — update caller; `patch()` `sceneWords` onto the job alongside `heygenVideoIds`

### 7.3 — Slide planner

- [ ] `src/lib/prompts/slide-planner.ts` — exports `buildSlidePlannerPrompt({ niche, scene, sceneIndex, sceneWords, title })`. Demands `startPhrase`/`endPhrase` be exact substrings of the scene text; ~1 slide per 15s of audio guideline; hard `max(8)` cap; niche tone from `niche.promptTone`
- [ ] `src/lib/pipeline/plan-slides.ts` — exports `planSlides(...)`. Reuses `spawnClaude` (same stdin pipe + fence-stripping). Parses through `SlidePlanSchema`
- [ ] In `queue.ts`, planner spawn uses the existing `runClaudeSerial` chain — no extra serialization

### 7.4 — Slide image generation

- [ ] `src/lib/pipeline/generate-slide-images.ts` — collects every `imagePrompt`, fires fal.ai calls via `Promise.all`. Reuses auth pattern from `generate-thumbnail.ts` (no `image_urls`, this is text-to-image not edit). Saves to `output/slide-images/{jobId}/{sceneIdx}_{slideIdx}_{panelIdx}.png`
- [ ] Per-type `image_size`: diagram `{ width: 1536, height: 1024 }`, grid panels `{ width: 1024, height: 1024 }`
- [ ] Partial failure here is a hard fail (broken slides look worse than no slides)

### 7.5 — Slide timing resolver

- [ ] `src/lib/pipeline/resolve-slide-timing.ts` — given a slide's `{ startPhrase, end }` + scene's `WordTimestamp[]`, return `{ startFrame, endFrame }` at fps 30. Algorithm: lowercase + strip punctuation; sliding-window match; pick earliest. If `end.kind === "hold"`, `endFrame = startFrame + Math.round(end.seconds * 30)`. If unmatched, fall back to scene midpoint with logged warning (not a failure)
- [ ] Build full `JobRenderProps` here too (each scene's `videoUrl` from `/api/file?path=...`, `durationSec` from the scene's last word's `end`)

### 7.6 — Remotion components (under `src/remotion/`)

- [ ] `theme.ts` — single unified theme (navy `#0e2a4d`, light-blue bg `#cfe7f5`, red accent `#d83a3a`, Inter stack)
- [ ] `slides/_primitives.tsx` — `<HeaderBar>`, `<FooterCaption>`, `<PanelCard>`, `<SirenBadge>`, `<NumberedBadge>`, `<CalloutPill>`, `<EnterExit>` (200ms fade+slide-up enter, 150ms fade-out exit)
- [ ] `slides/TitleSlide.tsx`
- [ ] `slides/BulletsSlide.tsx`
- [ ] `slides/StatSlide.tsx`
- [ ] `slides/DiagramSlide.tsx` — central `<Img>` with absolute-positioned `<CalloutPill>`s by `position` enum
- [ ] `slides/StepsSlide.tsx` — 3 panels horizontal with arrow connectors
- [ ] `slides/WarningGridSlide.tsx` — 4-panel emergency grid
- [ ] `slides/ActionGridSlide.tsx` — N-panel numbered grid
- [ ] `slides/{Type}SlideDesign.tsx` — Studio-only wrappers with rich `defaultProps` for visual iteration without running the pipeline
- [ ] `avatar/AvatarLayer.tsx` — avatar `<OffthreadVideo>` + PIP/cover toggle (PIP: top-right circle, ~18% width; Cover: layer hidden for slide's frame range)
- [ ] `compositions/JobComposition.tsx` — receives `JobRenderProps`. One `<Sequence from={cumulativeFrames}>` per scene; inside each, `<AvatarLayer>` + scene's slides positioned by resolved `startFrame`/`endFrame`. Uses `calculateMetadata` for dynamic `durationInFrames`
- [ ] `compositions/JobPreview.tsx` — wrapper passing `fixtures/sample-job.ts` data into `JobComposition`
- [ ] `fixtures/sample-job.ts` — hand-built `JobRenderProps`, one scene + two slides, points at a local test MP4
- [ ] `Root.tsx` — registers `JobComposition` (production), `JobPreview`, and the 7 `SlideDesign` comps

### 7.7 — Render orchestration

- [ ] `src/lib/pipeline/render-final.ts` — exports `renderFinal({ jobRenderProps, videoId, onProgress })`. First call: `bundle({ entryPoint: 'src/remotion/index.ts' })`, cache served URL on `globalThis.__remotionBundle`. Then `selectComposition` + `renderMedia({ codec: 'h264', crf: 18, fps: 30, outputLocation: 'output/final/{videoId}.mp4', onProgress })`. Also writes `output/final/{videoId}.props.json` next to the MP4 (debug fixture — copy into `fixtures/sample-job.ts` to reproduce in Studio)
- [ ] `onProgress({ progress })` calls `patch(batchId, jobId, { progress: 95 + Math.round(progress * 5) })` for live render percentage in SSE

### 7.8 — Queue integration

- [ ] `src/lib/queue.ts` — extend `runJob` with the two-branch fork after `splitting_scenes`. Branch A: `submitting_heygen` → `polling_heygen` → `downloading_video` → `generating_thumbnail` (existing path, plus emitting `sceneWords`). Branch B (new): `planning_slides` → `generating_slide_images`. Join with `Promise.all`. Then sequential: `resolving_slide_timing` → `editing`
- [ ] Hybrid failure handling: try/catch around branch B's planner — on failure, emit `slides_failed`, set `slidePlan = { scenes: scenes.map((_, i) => ({ sceneIndex: i, slides: [] })) }`, continue. Image-gen failure throws normally → job `failed`. Wrap `renderFinal` in its own try/catch — on failure, set `step: editing_failed` + `editError`, leave job NOT marked `failed`
- [ ] Add `reeditJob(batchId, jobId)` — re-runs only `resolving_slide_timing` + `editing`. Mirrors `resubmitJob` (resets step, re-emits `batch_complete` on settle)

### 7.9 — Server action + UI

- [ ] `src/app/actions.ts` — add `reedit(batchId, jobId)` mirroring `resubmit()`
- [ ] `src/components/ResultsTable.tsx` — render Final-video download link via `/api/file?path=output/final/{videoId}.mp4&download=1` when `Job.finalVideoPath` set; render `Re-edit` button when `Job.step === "editing_failed"`; display `Job.editError` distinctly from `Job.error`
- [ ] No changes needed to `useSSE.ts` — `SSEEventSchema.data` is `JobSchema.partial()`, new fields propagate automatically

### 7.10 — Documentation

- [ ] Update `CLAUDE.md` Architecture/Pipeline section: extend per-URL pipeline list with slide planner + image gen + resolve timing + Remotion render. Add "Remotion editing" subsection under Non-obvious conventions covering `JobRenderProps` schema, props.json debug-dump, two-branch parallelism

### Patterns to reuse (don't reimplement)

- **`spawnClaude` (`src/lib/pipeline/spawn-claude.ts`)** — used as-is for the planner. stdin-piping + fence-stripping works for any JSON-output prompt
- **`runClaudeSerial` (`src/lib/queue.ts:195`)** — existing `claudeChain` already serializes Claude spawns; planner slots in with zero new gating
- **fal.ai REST pattern (`src/lib/pipeline/generate-thumbnail.ts`)** — copy auth header + sync-REST shape; only differences are `image_size` and dropping `image_urls`
- **`/api/file/route.ts`** — already serves anything under `output/` with directory-traversal protection. Remotion's Chromium fetches videos + slide images through it
- **`patch()` + `emitJob` in `JobQueue`** — same path for emitting render progress
- **Schema-as-source-of-truth convention** — every new shape `z.infer`'d from a zod schema; planner output `.parse()`'d at the boundary; Remotion uses `@remotion/zod-types` so Studio gets a typed schema editor for fixtures

### Phase 7 verification

End-to-end:

1. `npm install` at root after consolidation
2. `npm run remotion:studio` — Studio loads, all design comps appear, `JobPreview` renders sample fixture
3. `npm run dev` — page loads, generate flow still works for an existing-style job (sanity check refactor didn't regress Phases 1–6)
4. Submit one URL — pipeline walks through new steps, produces `output/final/{videoId}.mp4` + `{videoId}.props.json`
5. Copy `{videoId}.props.json` into `fixtures/sample-job.ts`, reload Studio — reproduces rendered output exactly (validates debug-dump)
6. Trigger planner failure (block `claude` binary or feed malformed niche) — job → `slides_failed`, then bare-stitched render, finishes `editing` complete with watchable no-slides MP4
7. Trigger Remotion failure (rename a slide component import) — job → `editing_failed`, per-scene MP4s + thumbnail still in UI, `Re-edit` button visible. Fix bug, click Re-edit — re-runs only timing + editing
8. 3-URL batch — Branch B finishes during HeyGen polling; total wall-clock ≤ current pipeline

Type/lint:

- `npx tsc --noEmit` — passes for entire repo (no more `remotion/` exclusion to hide errors)
- `npm run lint` — passes

### Phase 7 risks

1. **React/Tailwind version reconciliation during 7.0** — bumping root React 19.1 → 19.2.3 may surface subtle Next.js 15 incompatibilities. Mitigation: smoke-test `npm run dev` immediately after the bump, before touching anything else
2. **Remotion Chromium download on first `bundle()`** — first run pulls Chromium (~150 MB). One-time cost; `.gitignore` already covers it via `node_modules/`
3. **fal.ai cost / latency on grid slides** — a video with 5 grid slides averaging 4 panels each = 20 image gens × ~$0.04 × ~3s = ~$0.80 and ~60s per video. Acceptable but worth monitoring; consider per-job image budget cap if it gets out of hand
4. **Phrase matching robustness** — Claude could emit a `startPhrase` that doesn't exactly substring-match (paraphrased, punctuation drift). Mitigation: fuzzy match in `resolve-slide-timing.ts` + scene-midpoint fallback + logged warning. Monitor failure rate in early runs and tighten planner prompt if needed

---

## File Structure

```
claude-heygen-yt-automation/
├── .env.local
├── next.config.ts
├── package.json
├── tsconfig.json
├── output/
│   ├── videos/                     # Downloaded MP4s
│   └── thumbnails/                 # Generated thumbnails
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── actions.ts            # server actions: getAvatars, generate, resubmit
│   │   └── api/
│   │       ├── progress/route.ts       # SSE — actions can't stream
│   │       └── file/route.ts           # binary file response (mp4/png under output/)
│   ├── components/
│   │   ├── AvatarSelector.tsx
│   │   ├── NicheSelector.tsx
│   │   ├── UrlInput.tsx
│   │   └── ResultsTable.tsx
│   ├── lib/
│   │   ├── queue.ts
│   │   ├── niches.ts
│   │   ├── types.ts
│   │   ├── sse.ts
│   │   ├── env.ts
│   │   └── pipeline/
│   │       ├── fetch-transcript.ts
│   │       ├── fetch-competitor-thumb.ts
│   │       ├── spawn-claude.ts
│   │       ├── split-scenes.ts
│   │       ├── heygen-submit.ts
│   │       ├── heygen-poll.ts
│   │       ├── download-video.ts
│   │       └── generate-thumbnail.ts
│   ├── hooks/
│   │   └── useSSE.ts
│   └── remotion/
│       ├── remotion.config.ts
│       ├── index.ts                # registerRoot entry point
│       └── Root.tsx                # Composition registry
```

---

## Thumbnail Provider — fal.ai `openai/gpt-image-2`

Sync REST: `POST https://fal.run/openai/gpt-image-2`, header `Authorization: Key $FAL_KEY`.

Body:
```json
{
  "prompt": "...",
  "image_urls": ["<face S3 URL>", "<YouTube img URL>"],
  "image_size": { "width": 1536, "height": 1024 },
  "quality": "high",
  "output_format": "png",
  "num_images": 1
}
```

Response: `{ images: [{ url, width, height, content_type }] }` — stream the signed `url` to disk.

Both inputs are already public URLs (HeyGen `photo_identity_s3_url` and `https://img.youtube.com/vi/{id}/{res}.jpg`), so no fal-storage upload step is needed — `image_urls[]` is consumed directly.

---

## Key Decisions

- Queue singleton via `globalThis` (survives Next.js HMR)
- Claude CLI prompt piped via stdin (avoids Windows 32k char cmd limit)
- Voice tied to avatar (no separate voice selector)
- Niches: `{ id, name, promptTone, defaultTags }` in config file
- No database — in-memory state, lost on restart
- Thumbnail generation via fal.ai `openai/gpt-image-2` — multi-image edit with public URLs (face + competitor thumb), 1536x1024 PNG. The OpenAI Platform `images/edits` flow worked but cost added up; the ChatGPT Plus private API was investigated and rejected (Sentinel proof-of-work + Turnstile + conduit tokens make it impossible to call from Node).
- Face image for thumbnail generation is pulled from the selected HeyGen avatar's `photo_identity_s3_url` (exposed as `faceImageUrl` on `HeyGenAvatar`, camelCased at the boundary via zod). No user-upload surface — the avatar already is the face.
- Competitor thumbnail URL (`img.youtube.com`) is preserved on the `Job` (`competitorThumbUrl`) alongside the local download path, so the fal.ai call can pass the URL directly without re-uploading.
- HeyGen avatar list uses the private `api2.heygen.com/v2/avatar_group.private.list` endpoint with cookie auth (not the public API-key endpoint), because it returns `photo_identity_s3_url` and `default_voice_id` directly.

## Risks

1. **Claude CLI output parsing** — may wrap in markdown code blocks. Handle with explicit prompt + regex
2. **HeyGen avatar/voice coupling** — verify `/v2/avatars` includes voice info; may need `/v2/voices` + mapping

---

## Verification Checklist

- [ ] `npm run dev` → page loads at `localhost:3000`
- [ ] Avatar dropdown populates from HeyGen
- [ ] Single URL → full pipeline → MP4 + thumbnail + metadata
- [ ] Multi-URL → all queue and process with SSE progress
- [ ] Failed job → resubmit works
- [ ] `cd remotion && npx remotion studio` still works
