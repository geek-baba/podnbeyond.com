# Run Migration Now

## Quick Command

SSH into staging server and run:

```bash
ssh your-staging-user@your-staging-host
cd /home/capsulepodhotel-staging/htdocs/staging.capsulepodhotel.com/backend
export DATABASE_URL='your-database-url'
node scripts/migrate-integrations-from-env.js
```

## Or if you're already on the server:

```bash
cd /home/capsulepodhotel-staging/htdocs/staging.capsulepodhotel.com/backend
node scripts/migrate-integrations-from-env.js
```

The script will:
- Read integrations from environment variables
- Encrypt sensitive data
- Create database entries
- Skip any that already exist

