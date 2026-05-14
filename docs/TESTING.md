# Life Admin OS Testing

Run the full automated suite:

```bash
npm test
```

Run backend tests only:

```bash
npm --prefix backend test
```

Run frontend tests only:

```bash
npm --prefix frontend test
```

## Current Coverage

- Unit tests for validation helpers, Gmail email parsing, and frontend subscription cost calculations.
- API tests for bill creation, invalid bill rejection, owned-record deletion behavior, and analytics summaries.
- Integration test for reminder generation across bills, subscriptions, and documents.

## Manual Showcase Flow

Use this flow before a demo or deployment:

1. Register a new account.
2. Log in and open the dashboard.
3. Add a bill due soon.
4. Add an active subscription.
5. Add a document and upload a PDF, JPG, or PNG.
6. Run the reminder check job.
7. Confirm the dashboard and notifications update for the new records.
