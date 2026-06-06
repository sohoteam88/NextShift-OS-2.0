# Deployment Engineer Checklist

Before finishing a `deployment-engineer` task, check:

- [ ] Referenced `docs/architecture/18_DEPLOYMENT_ARCHITECTURE.md` for infrastructure specs
- [ ] No secrets in config files committed to git
- [ ] Internal services bind to 127.0.0.1, not 0.0.0.0
- [ ] SSL minimum TLS 1.2 configured
- [ ] Security headers present in Nginx config
- [ ] Health check endpoint defined and tested
- [ ] Docker containers have restart policies
- [ ] Container runs as non-root when possible
- [ ] Backup strategy covers database + files + config
- [ ] Rollback procedure documented
- [ ] Verification steps included at the end
- [ ] Output is copy-paste ready for the target environment
