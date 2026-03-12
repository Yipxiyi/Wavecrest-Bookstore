# MEMORY.md - Long-term Memory

## Active Projects

### Wavecrest Bookstore Data Architecture
**Status:** Design Phase  
**Goal:** Multi-source book metadata system using NeoDB  
**Deliverables:**
- ✅ Architecture document (ARCHITECTURE.md)
- ✅ NeoDB Sync Agent prototype
- ⏳ Database schema implementation
- ⏳ API Gateway setup
- ⏳ Frontend integration

**Key Decisions:**
- SQLite for local persistence (cost-effective)
- images.weserv.nl for image proxy
- Cron-based sync every 4 hours
- Static JSON export for GitHub Pages

## Technical Stack Preferences

| Layer | Technology | Reason |
|-------|-----------|--------|
| Database | SQLite/PostgreSQL | ACID compliance, JSON support |
| Cache | Redis | Fast, simple, Bull queue support |
| Queue | Bull (Redis) | Reliable, Node.js native |
| API | Fastify | Fast, low overhead |
| Language | TypeScript | Type safety, good DX |

## API Integration Notes

### NeoDB
- Base URL: https://neodb.social/api
- Rate limit: ~60 req/min
- Auth: Optional OAuth for user data
- Key endpoints:
  - `/catalog/search?query={q}`
  - `/book/{uuid}`

### Image Proxy
- Service: images.weserv.nl
- Usage: `https://images.weserv.nl/?url={encoded_url}`
- Purpose: Bypass referer restrictions

## Design Patterns

### Data Sync Pattern
```
External API → Adapter → Normalizer → DB → Cache → Export
```

### Error Handling Strategy
1. Retry with exponential backoff (3 attempts)
2. Log to sync_logs table
3. Mark record status as 'error'
4. Alert on consecutive failures

### Cache Invalidation
- Time-based: TTL 4 hours for API responses
- Event-based: On successful sync, update cache
- Manual: Admin endpoint for force refresh

## Security Considerations

- API keys in environment variables only
- No secrets in Git history
- Rate limiting on all external calls
- Input validation before DB writes
- SQL injection prevention (parameterized queries)

## Performance Targets

- API response: < 200ms (cached)
- DB query: < 50ms
- Sync job: < 5 min per 100 books
- Memory usage: < 512MB per worker

## Cost Optimization

- Use free tiers: NeoDB, images.weserv.nl
- SQLite instead of hosted DB for small scale
- GitHub Actions for scheduled tasks (free)
- Lazy loading for images

## Open Questions

- [ ] Need OAuth for NeoDB user-specific data?
- [ ] Cover image storage: local vs CDN?
- [ ] Search: client-side vs MeiliSearch?
- [ ] Real-time updates: WebSocket or polling?
