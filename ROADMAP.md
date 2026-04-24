# YouTube Automation Pipeline — Roadmap

> **Keep this file updated.** Mark items as they're completed. This is the single source of truth for project progress.

---

## Architecture

- **Next.js app at root**, Remotion in `remotion/` subfolder for future post-processing
- **Single page UI**: avatar selector + niche dropdown + face upload + multi-URL input + results table
- **Queue-based**: sequential Claude Code CLI spawning, parallel HeyGen polling
- **SSE** for real-time progress
- **Local only** — no auth

**Env keys:** `HEYGEN_API_KEY`, `HEYGEN_COOKIE` (for private `api2.heygen.com` endpoints), `OPENAI_API_KEY`, `YOUTUBE_TRANSCRIPT_API_TOKEN`

---

## Pipeline Flow (per URL)

1. Fetch transcript — `youtube-transcript.io` API
2. Fetch competitor thumbnail — `img.youtube.com/vi/{id}/maxresdefault.jpg`
3. Spawn Claude Code CLI — writes ~15k char script + metadata (title, tags, description)
4. Split script — sentence boundaries, max 4,800 chars/scene
5. Submit to HeyGen — `POST /v2/video/generate`
6. Poll HeyGen — every 30s until complete
7. Download MP4 — save to `output/videos/`
8. Generate thumbnail — ChatGPT `gpt-4o` with face ref + competitor thumbnail
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

- [ ] `src/lib/pipeline/fetch-transcript.ts` — POST to `youtube-transcript.io/api/transcripts`
- [ ] `src/lib/pipeline/fetch-competitor-thumb.ts` — download from `img.youtube.com`
- [ ] `src/lib/pipeline/spawn-claude.ts` — `child_process.spawn("claude", ["-p", "--output-format", "json"])`, pipe prompt via stdin
- [ ] `src/lib/pipeline/split-scenes.ts` — sentence-boundary splitter, max 4,800 chars
- [ ] `src/lib/pipeline/heygen-submit.ts` — POST `/v2/video/generate`
- [ ] `src/lib/pipeline/heygen-poll.ts` — 30s interval polling
- [ ] `src/lib/pipeline/download-video.ts` — fetch MP4 → `output/videos/`
- [ ] `src/lib/pipeline/generate-thumbnail.ts` — ChatGPT `gpt-4o` with face ref (from avatar's `faceImageUrl`) + competitor thumbnail
- [ ] `src/lib/niches.ts` — niche configs (health, politics)

## Phase 4: Queue + Orchestration

- [ ] `src/lib/queue.ts` — in-memory `JobQueue` (EventEmitter, `globalThis` singleton, sequential Claude gating, parallel HeyGen polling)
- [ ] `generate()` server action — accept `{ urls[], avatarId, voiceId, niche, faceImageUrl }` (`faceImageUrl` comes from the selected avatar), create batch, return `batchId`
- [ ] `GET /api/progress` — SSE via `ReadableStream`, subscribe to queue events (route handler, not a server action — actions can't stream)

## Phase 5: Wire Frontend

- [ ] `src/hooks/useSSE.ts` — `EventSource` wrapper hook
- [ ] Connect Generate button → `generate()` action
- [ ] Connect `ResultsTable` to SSE progress stream
- [ ] Copy-to-clipboard for title, tags, description
- [ ] Download links for MP4s
- [ ] Thumbnail previews in results table

## Phase 6: Polish

- [ ] `resubmit()` server action — retry failed jobs
- [ ] Error states and loading indicators
- [ ] YouTube URL parsing utility (`youtube.com/watch?v=`, `youtu.be/`, `youtube.com/shorts/`)

---

## File Structure

```
claude-heygen-yt-automation/
├── .env.local
├── next.config.ts
├── package.json
├── tsconfig.json
├── remotion/
│   ├── remotion.config.ts
│   ├── package.json
│   └── src/
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
│   │       └── download-video/route.ts # binary file response
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
│   └── hooks/
│       └── useSSE.ts
```

---

## Key Decisions

- Queue singleton via `globalThis` (survives Next.js HMR)
- Claude CLI prompt piped via stdin (avoids Windows 32k char cmd limit)
- Voice tied to avatar (no separate voice selector)
- Niches: `{ id, name, promptTone, defaultTags }` in config file
- No database — in-memory state, lost on restart
- Thumbnail face matching via `gpt-4o` chat completions with image inputs
- Face image for thumbnail generation is pulled from the selected HeyGen avatar's `photo_identity_s3_url` (exposed as `faceImageUrl` on `HeyGenAvatar`, camelCased at the boundary via zod). No user-upload surface — the avatar already is the face.
- HeyGen avatar list uses the private `api2.heygen.com/v2/avatar_group.private.list` endpoint with cookie auth (not the public API-key endpoint), because it returns `photo_identity_s3_url` and `default_voice_id` directly.

## Risks

1. **gpt-4o face matching** — may not reliably reproduce faces. Fallback: composite (AI background + real photo overlay)
2. **Claude CLI output parsing** — may wrap in markdown code blocks. Handle with explicit prompt + regex
3. **HeyGen avatar/voice coupling** — verify `/v2/avatars` includes voice info; may need `/v2/voices` + mapping

---

## Verification Checklist

- [ ] `npm run dev` → page loads at `localhost:3000`
- [ ] Avatar dropdown populates from HeyGen
- [ ] Single URL → full pipeline → MP4 + thumbnail + metadata
- [ ] Multi-URL → all queue and process with SSE progress
- [ ] Failed job → resubmit works
- [ ] `cd remotion && npx remotion studio` still works
