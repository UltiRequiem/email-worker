# Contact Form Worker - Claude Project Documentation

## Project Overview

This is a Cloudflare Worker that processes contact form submissions from a website and sends emails using Cloudflare's Email Routing service. The worker acts as a serverless backend API endpoint for a contact form.

## Architecture

### Technology Stack
- **Runtime**: Cloudflare Workers (V8 isolate)
- **Email Service**: Cloudflare Email Routing
- **Email Library**: mimetext (MIME message formatting)
- **Deployment**: Wrangler CLI

### Key Components

1. **HTTP Handler** ([src/index.js](src/index.js))
   - Accepts POST requests only
   - Parses JSON request body
   - Validates required fields
   - Sends formatted emails
   - Returns JSON responses

2. **Email Configuration** ([wrangler.toml](wrangler.toml))
   - Email binding setup
   - Allowed destination addresses (security whitelist)
   - Node.js compatibility flags

## Code Structure

### Main Handler Flow

```
POST Request → Validate Method → Parse JSON → Validate Fields →
Create MIME Message → Send Email → Return Response
```

### Email Recipients

The worker sends emails to two recipients configured in:
- **Whitelist**: `wrangler.toml` line 9-11 (allowed_destination_addresses)
- **Recipients**: `src/index.js` line 30-31 (setRecipient calls)

**Important**: Both locations must match for successful email delivery.

### Email Format

The worker creates a plain text email with:
- Sender: contact@bobadilla.work
- Subject: "New Contact Form Submission from {name}"
- Body: Formatted with name, email, company (optional), and message

## Configuration Details

### wrangler.toml

```toml
compatibility_date = "2024-09-23"  # Must be >= 2024-09-23 for Node.js modules
compatibility_flags = ["nodejs_compat"]  # Required for mimetext dependencies
```

### Environment Bindings

- `env.CONTACT_EMAIL`: Email binding configured in wrangler.toml
- No secrets currently configured (commented in wrangler.toml)

## API Specification

### Request
```
POST /
Content-Type: application/json

{
  "name": "string (required)",
  "email": "string (required)",
  "company": "string (optional)",
  "message": "string (required)"
}
```

### Responses

**Success (200)**:
```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

**Validation Error (400)**:
```json
{
  "error": "Missing required fields: name, email, or message"
}
```

**Method Not Allowed (405)**:
```
Method not allowed
```

**Server Error (500)**:
```json
{
  "error": "Failed to send email",
  "details": "error message"
}
```

## Development Workflow

### Local Development
```bash
npm run dev
```
Starts local development server with hot reload.

### Deployment
```bash
npm run deploy
```
Deploys to Cloudflare Workers production environment.

### Logs
```bash
npm run tail
```
Streams real-time logs from the deployed worker.

## Common Issues & Solutions

### 1. TOML Syntax Errors
**Issue**: Inline tables with newlines not allowed
**Solution**: Use `[[send_email]]` table array syntax instead of `send_email = [{...}]`

### 2. Node.js Module Resolution
**Issue**: `Could not resolve "path"` - Node.js built-in modules not found
**Solution**:
- Add `compatibility_flags = ["nodejs_compat"]`
- Set `compatibility_date >= "2024-09-23"`

### 3. Email Not Delivered
**Issue**: Emails not reaching recipients
**Checklist**:
- Verify email addresses match in both `wrangler.toml` (whitelist) and `src/index.js` (recipients)
- Confirm sender domain is configured in Cloudflare Email Routing
- Check worker logs for errors

### 4. CORS Issues
**Issue**: Browser blocks cross-origin requests
**Solution**: Update `Access-Control-Allow-Origin` header in response (line 70)

## Security Considerations

1. **Input Validation**: All required fields validated before processing
2. **Email Whitelist**: Destinations restricted in wrangler.toml
3. **Method Restriction**: Only POST requests accepted
4. **CORS**: Currently allows all origins (`*`) - should be restricted for production

## Future Enhancements

Potential improvements:
- Rate limiting per IP address
- Email address format validation
- Spam detection/CAPTCHA integration
- HTML email templates
- Multiple form templates
- Email sending confirmation/tracking
- Environment-specific configurations (dev/staging/prod)

## Dependencies

### Production
- `mimetext@^3.0.0`: MIME message creation and formatting

### Development
- `wrangler@^3.0.0`: Cloudflare Workers CLI

### Implicit (via mimetext)
- `mime-types`: MIME type detection (requires Node.js `path` module)

## Deployment Checklist

Before deploying:
- [ ] Update email addresses in wrangler.toml
- [ ] Update email addresses in src/index.js
- [ ] Update sender domain in src/index.js
- [ ] Configure CORS for production domain
- [ ] Test with `wrangler dev` locally
- [ ] Verify Cloudflare Email Routing is configured
- [ ] Deploy with `npm run deploy`
- [ ] Test production endpoint
- [ ] Monitor logs with `npm run tail`

## Contact

For issues or questions about this worker, contact:
- eliaz@bobadilla.work
- ale@bobadilla.work
