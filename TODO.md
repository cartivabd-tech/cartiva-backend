# TODO

## Step 1
Review server code for readability/quality issues and identify safe refactors.
- [x] Read: server/index.js, auth middleware, jwt util, and models.
- [x] Read: js/app.js for client readability concerns.

## Step 2
Implement code-only refactor/safety improvements (no endpoint/UI behavior changes).
- [ ] server/index.js: extract helpers; make JWT verification consistent; improve orderId collision handling.
- [ ] server/utils/jwt.js: (if needed) add verify helper to avoid duplicated secret logic.

## Step 3
Run a quick sanity check.
- [ ] Start backend locally (if env vars available) or run node syntax check.

## Step 4
Git commit + push.
- [ ] Commit changes with a clear message.
- [ ] Push to current branch.

