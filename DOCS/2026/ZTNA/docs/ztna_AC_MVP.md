# Minimum Viable Product (MVP)

## Cloudflare Zero Trust Setup
- [ ] Cloudflare Zero Trust account configured
- [ ] Team and access groups created
- [ ] Identity provider (SSO) integrated
- [ ] Device posture requirements defined

## Web Application Access
- [ ] Cloudflare Tunnel (cloudflared) deployed
- [ ] Internal web apps accessible via tunnel
- [ ] Access policies per application configured
- [ ] SSO enforcement working

## RDP/SSH Gateway
- [ ] TCP tunnel for RDP (port 3389) configured
- [ ] TCP tunnel for SSH (port 22) configured
- [ ] Custom port forwarding supported
- [ ] User access policies enforced

## Host-to-Host Connectivity
- [ ] Service Tokens generated
- [ ] Server-to-server tunnel configured
- [ ] Isolated network routing working
- [ ] Machine authentication functional

## Public IP Removal
- [ ] Server inventory with public IP documented
- [ ] Migration plan per server created
- [ ] Rollback procedure documented
- [ ] All targeted servers migrated

---

# Acceptance Criteria

## Web Application Access

### User Can Access Internal Web App
[ ] Fulfilled Scenario
```gherkin
Scenario: User accesses internal web application
    Given user is authenticated via SSO
    When user navigates to app.internal.company.com
    Then Cloudflare Access policy is checked
    And user is granted access if policy passes
    And internal web app is loaded successfully
```

### Access Policy Enforcement
[ ] Fulfilled Scenario
```gherkin
Scenario: Access denied due to policy failure
    Given user does not meet device posture
    When user tries to access internal app
    Then access is denied
    And user sees "Access Denied" message with reason
```

## RDP/SSH Access

### SSH via Cloudflare Tunnel
[ ] Fulfilled Scenario
```gherkin
Scenario: User SSH to server via tunnel
    Given user has SSH access policy
    When user runs: ssh -o "ProxyCommand cloudflared access ssh --hostname %h" user@server.internal
    Then SSH connection is established via tunnel
    And user is authenticated to target server
```

### RDP via Cloudflare Tunnel
[ ] Fulfilled Scenario
```gherkin
Scenario: User RDP to server via tunnel
    Given user has RDP access policy
    When user connects via RDP client through tunnel
    Then RDP connection is established
    And user can access remote desktop
```

### Custom Port Forwarding
[ ] Fulfilled Scenario
```gherkin
Scenario: User accesses custom port
    Given custom port tunnel is configured
    When user connects to custom port via tunnel
    Then connection is forwarded to target service
    And service is accessible
```

## Host-to-Host Connectivity

### Server-to-Server Communication
[ ] Fulfilled Scenario
```gherkin
Scenario: Server A communicates with Server B
    Given Server A has valid Service Token
    When Server A makes request to Server B via tunnel
    Then request is authenticated via Service Token
    And Server B accepts the connection
```

### Isolated Network Routing
[ ] Fulfilled Scenario
```gherkin
Scenario: Access to isolated network
    Given tunnel to isolated network is configured
    When request is made to isolated network resource
    Then traffic is routed via Cloudflare Tunnel
    And resource is accessible without public IP
```

## Public IP Removal

### Safe IP Removal
[ ] Fulfilled Scenario
```gherkin
Scenario: Public IP removal without disruption
    Given server is accessible via ZTNA
    When public IP is removed from server
    Then all services remain accessible via tunnel
    And no service disruption occurs
```

### Rollback Capability
[ ] Fulfilled Scenario
```gherkin
Scenario: Rollback to public IP access
    Given rollback procedure is documented
    When issue is detected after IP removal
    Then public IP can be re-assigned
    And service is restored within [X] minutes
```

---

[Planning Document](../ztna_plan_draft.md#22-acceptance-criteria-ac)
