# Skill Assessment Platform – Backend

Express + MongoDB API for the CUTM Awarding Body portal: training partner onboarding, centres, batches,
payments, assessments, marks and certificates.

## Requirements

- Node.js 20+
- MongoDB
- Redis 6+ (BullMQ queues for certificate generation and emails)
- AWS S3 bucket for uploads

## Setup

```bash
npm install
cp .env.example .env   # fill in real values
npm run dev            # api + workers with auto reload
```

| Script | What it does |
|---|---|
| `npm start` | API (and workers, unless `RUN_WORKERS_IN_PROCESS=false`) |
| `npm run dev` | Same with nodemon |
| `npm run worker` | Only the BullMQ workers, for running them as a separate process |

## Structure

```
src/
  routes/v1      route -> role mapping (allow(...) middleware)
  controller     thin http layer, errors go to middleware/errorHandler.js
  service        business rules and ownership checks
  repository     database access
  models         mongoose schemas
  queues         bullmq queues (certificate, email)
  workers        bullmq workers
  middleware     auth, rate limit, input sanitizing, error handler
```

## Authentication

Every protected request sends the JWT in the `x-access-token` header. Roles: `Admin`,
`TrainingPartner`, `AssesmentAgency`, `SNA`. A training partner / assesment agency can only change its
own records; an SNA only acts on its own state and scheme. The first admin can be created without a
token (`POST /api/v1/admin`), every later admin needs an admin token.

## Certificate publishing

`POST /api/v1/certificate/publish/exam/:examId` (admin) validates the exam and queues a job, answering
`202`. The certificate worker issues one certificate per present student whose result is `Pass`, then
marks the exam and batch as completed. Poll
`GET /api/v1/certificate/publish/exam/:examId/status` for `certificateStatus`
(`queued` → `processing` → `completed` / `failed`). Failed jobs are retried 3 times; a failed exam can be
published again.
