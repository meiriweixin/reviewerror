# Deployment Checklist

Use this checklist to ensure a smooth deployment of the Student Review App.

## Pre-Deployment

### Development Environment
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] All API endpoints working
- [ ] Database operations successful
- [ ] Image upload and processing working
- [ ] Google OAuth functioning
- [ ] Vector search operational

### Code Quality
- [ ] Code reviewed
- [ ] No hardcoded secrets
- [ ] Environment variables documented
- [ ] Comments added to complex logic
- [ ] Error handling implemented
- [ ] Loading states added

### Dependencies
- [ ] All dependencies up to date
- [ ] Security vulnerabilities checked (`npm audit`, `pip-audit`)
- [ ] Unused dependencies removed
- [ ] Package versions locked

## Service Setup

### Google OAuth
- [ ] Google Cloud project created
- [ ] OAuth 2.0 credentials created
- [ ] Authorized JavaScript origins configured:
  - [ ] Production domain added
  - [ ] Localhost added (for testing)
- [ ] Authorized redirect URIs configured:
  - [ ] Production domain added
  - [ ] Localhost added (for testing)
- [ ] Client ID copied to environment variables
- [ ] Client Secret copied to environment variables
- [ ] OAuth consent screen configured
- [ ] App logo uploaded (optional)

### Azure OpenAI
- [ ] Azure account created
- [ ] Azure OpenAI resource created
- [ ] GPT-4o model deployed
- [ ] Deployment name noted
- [ ] API endpoint copied
- [ ] API key copied to environment variables
- [ ] Quota checked and adequate
- [ ] Rate limits understood
- [ ] Billing alerts configured

### Supabase
- [ ] Supabase account created
- [ ] New project created
- [ ] PostgreSQL region selected (closest to users)
- [ ] Database password saved securely
- [ ] pgvector extension enabled
- [ ] `question_embeddings` table created
- [ ] Indexes created (IVFFlat for embeddings)
- [ ] Helper functions created (optional)
- [ ] Row Level Security configured
- [ ] Project URL copied
- [ ] Anon key copied
- [ ] Service role key copied (keep secret!)
- [ ] Automatic backups enabled
- [ ] PITR enabled (for production)

## Environment Configuration

### Frontend Environment
- [ ] `.env.local` created from `.env.example`
- [ ] `REACT_APP_API_URL` set to production backend URL
- [ ] `REACT_APP_GOOGLE_CLIENT_ID` set correctly
- [ ] `REACT_APP_SUPABASE_URL` set correctly
- [ ] `REACT_APP_SUPABASE_ANON_KEY` set correctly
- [ ] All variables verified

### Backend Environment
- [ ] `backend/.env` created from `backend/.env.example`
- [ ] `SECRET_KEY` generated (strong random string)
- [ ] `GOOGLE_CLIENT_ID` set
- [ ] `GOOGLE_CLIENT_SECRET` set
- [ ] `AZURE_OPENAI_ENDPOINT` set
- [ ] `AZURE_OPENAI_API_KEY` set
- [ ] `AZURE_OPENAI_DEPLOYMENT_NAME` set
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (not anon key!)
- [ ] `DATABASE_URL` set (PostgreSQL for production)
- [ ] `ALLOWED_ORIGINS` set with production domains
- [ ] All variables verified

## Security Checklist

### Secrets Management
- [ ] No secrets in git repository
- [ ] `.env` files in `.gitignore`
- [ ] Environment variables set in deployment platform
- [ ] API keys rotated from default values
- [ ] Strong `SECRET_KEY` generated
- [ ] Database password is strong

### Application Security
- [ ] HTTPS enabled
- [ ] SSL certificate installed
- [ ] CORS configured correctly
- [ ] Rate limiting configured
- [ ] Input validation in place
- [ ] File upload restrictions enforced
- [ ] SQL injection protection (ORM usage)
- [ ] XSS protection (React escaping)
- [ ] CSRF protection (for forms)
- [ ] Security headers configured

### Access Control
- [ ] Admin access restricted
- [ ] Database access restricted to backend only
- [ ] Service role keys not exposed to frontend
- [ ] Google OAuth scopes minimized
- [ ] User data isolation verified

## Database Setup

### Production Database
- [ ] PostgreSQL database created (if not using Supabase)
- [ ] Database migrations run
- [ ] All tables created
- [ ] Indexes created
- [ ] Foreign keys configured
- [ ] Constraints added
- [ ] Test data removed

### Backups
- [ ] Backup strategy defined
- [ ] Automated backups configured
- [ ] Backup restoration tested
- [ ] Backup retention policy set
- [ ] Point-in-time recovery enabled (if supported)

## Frontend Deployment

### Build Process
- [ ] `npm run build` successful
- [ ] Build size optimized (<5MB ideal)
- [ ] No build warnings
- [ ] Source maps generated (for debugging)
- [ ] Production environment variables set

### Deployment Platform (Vercel/Netlify/etc.)
- [ ] Account created
- [ ] Project connected to GitHub
- [ ] Build settings configured:
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `build`
  - [ ] Node version specified
- [ ] Environment variables added
- [ ] Custom domain configured (if applicable)
- [ ] DNS records updated
- [ ] SSL certificate provisioned
- [ ] Deploy preview working

### Testing Deployed Frontend
- [ ] Site loads correctly
- [ ] All pages accessible
- [ ] Images load
- [ ] Styling correct
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)

## Backend Deployment

### Build Process
- [ ] All dependencies in `requirements.txt`
- [ ] Python version specified
- [ ] Start command tested
- [ ] Port configuration correct
- [ ] Upload directory created

### Deployment Platform (Railway/Render/Azure/etc.)
- [ ] Account created
- [ ] Project/service created
- [ ] Environment variables configured
- [ ] Start command set: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Health check endpoint configured
- [ ] Scaling settings configured
- [ ] Region selected (close to users)

### Testing Deployed Backend
- [ ] Health endpoint working (`/health`)
- [ ] API documentation accessible (`/docs`)
- [ ] All endpoints responding
- [ ] Database connection working
- [ ] File uploads working
- [ ] Azure OpenAI integration working
- [ ] Supabase connection working
- [ ] CORS working with frontend
- [ ] Authentication working
- [ ] Error handling working

## Integration Testing

### End-to-End Tests
- [ ] User registration flow
- [ ] Login with Google
- [ ] Grade selection
- [ ] Image upload
- [ ] Question extraction
- [ ] Question review
- [ ] Status updates
- [ ] Progress tracking
- [ ] Search functionality
- [ ] Logout

### Cross-Platform Testing
- [ ] Desktop browsers:
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge
- [ ] Mobile browsers:
  - [ ] iOS Safari
  - [ ] Android Chrome
- [ ] Tablet devices
- [ ] Different screen sizes

## Monitoring & Logging

### Monitoring Setup
- [ ] Error tracking configured (Sentry, LogRocket, etc.)
- [ ] Application performance monitoring (APM)
- [ ] Uptime monitoring (UptimeRobot, Pingdom)
- [ ] Log aggregation (Logtail, Papertrail)
- [ ] Analytics (Google Analytics, Mixpanel)

### Alerts
- [ ] Error rate alerts
- [ ] Downtime alerts
- [ ] API quota alerts (Azure, Supabase)
- [ ] Database size alerts
- [ ] Performance degradation alerts

### Dashboards
- [ ] Application metrics dashboard
- [ ] User analytics dashboard
- [ ] API usage dashboard
- [ ] Error tracking dashboard

## Performance Optimization

### Frontend
- [ ] Code splitting implemented
- [ ] Lazy loading for routes
- [ ] Images optimized
- [ ] Bundle size analyzed
- [ ] Caching headers configured
- [ ] CDN configured (if applicable)

### Backend
- [ ] Database queries optimized
- [ ] Indexes added for common queries
- [ ] Connection pooling configured
- [ ] Caching strategy implemented (Redis, if applicable)
- [ ] Response time acceptable (<500ms average)

## Documentation

### User Documentation
- [ ] User guide created
- [ ] FAQ created
- [ ] Tutorial videos (optional)
- [ ] Help center setup (optional)

### Developer Documentation
- [ ] README updated
- [ ] API documentation complete
- [ ] Architecture documented
- [ ] Deployment guide complete
- [ ] Contributing guide created

### Legal Documentation
- [ ] Privacy Policy created
- [ ] Terms of Service created
- [ ] Cookie policy (if applicable)
- [ ] GDPR compliance (if applicable)

## Post-Deployment

### Launch Checklist
- [ ] Announce to users
- [ ] Social media posts
- [ ] Email notifications (if applicable)
- [ ] Press release (optional)

### Monitoring
- [ ] Monitor error rates first 24 hours
- [ ] Check user feedback
- [ ] Monitor API quotas
- [ ] Check database performance
- [ ] Monitor costs

### Immediate Tasks
- [ ] Fix critical bugs (if any)
- [ ] Respond to user feedback
- [ ] Update documentation based on issues
- [ ] Plan next iteration

## Maintenance Schedule

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Check API quotas

### Weekly
- [ ] Review user feedback
- [ ] Check performance metrics
- [ ] Database maintenance (vacuum, analyze)
- [ ] Review security alerts

### Monthly
- [ ] Update dependencies
- [ ] Review and rotate API keys
- [ ] Check backup integrity
- [ ] Performance review
- [ ] Cost analysis

### Quarterly
- [ ] Security audit
- [ ] Load testing
- [ ] Database optimization
- [ ] Architecture review

## Rollback Plan

### Preparation
- [ ] Previous version tagged in git
- [ ] Database backup created
- [ ] Rollback procedure documented
- [ ] Downtime window communicated (if needed)

### Rollback Steps (if needed)
1. [ ] Revert to previous git commit
2. [ ] Restore database from backup (if needed)
3. [ ] Redeploy frontend
4. [ ] Redeploy backend
5. [ ] Verify functionality
6. [ ] Communicate to users

## Sign-Off

### Final Checks
- [ ] All checklist items completed
- [ ] Team review completed
- [ ] Stakeholder approval received
- [ ] Launch date confirmed

### Launch
- [ ] Deployment executed
- [ ] Verification completed
- [ ] Monitoring active
- [ ] Team on standby
- [ ] Success! 🎉

---

**Deployment Date:** _________________

**Deployed By:** _________________

**Version:** _________________

**Notes:**
