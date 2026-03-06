# Minimum Viable Product (MVP)

## SSO Integration
- [ ] SAML 2.0 support
- [ ] OIDC support
- [ ] Corporate IdP integration (Azure AD / Okta)
- [ ] Session management

## User Provisioning (SCIM)
- [ ] Auto user creation from IdP
- [ ] User attribute synchronization
- [ ] User deactivation on offboarding

## Security
- [ ] MFA support (via IdP)
- [ ] Role-based access control
- [ ] Secure session handling

## Non-Functional
- [ ] Auth response < 2s
- [ ] 99.9% uptime
- [ ] Works on Chrome/Firefox/Edge

---

# Acceptance Criteria

## SSO Login

### Successful SSO Login
[ ] Fulfilled Scenario
```gherkin
Scenario: Successful login with valid credentials
    Given user is on application login page
    When user clicks "Login with SSO"
    And user enters valid IdP credentials
    Then user is redirected to dashboard
    And session token is stored securely
```

### Failed Login Handling
[ ] Fulfilled Scenario
```gherkin
Scenario: Failed login with invalid credentials
    Given user is on IdP login page
    When user enters invalid credentials
    Then error message is displayed
    And user can retry login
```

### Session Timeout
[ ] Fulfilled Scenario
```gherkin
Scenario: Session timeout handling
    Given user has active session
    When session expires (idle > 30 min)
    Then user is redirected to login
    And message "Session expired" is shown
```

## SCIM Provisioning

### User Creation
[ ] Fulfilled Scenario
```gherkin
Scenario: New user synced from IdP
    Given new user is created in IdP
    When SCIM sync runs
    Then user is auto-created in application
    And user receives welcome email
```

### User Attribute Sync
[ ] Fulfilled Scenario
```gherkin
Scenario: User profile update synced
    Given user's email is changed in IdP
    When SCIM sync runs
    Then user's email is updated in application
```

### User Deactivation
[ ] Fulfilled Scenario
```gherkin
Scenario: User offboarding synced
    Given user is disabled in IdP
    When SCIM sync runs
    Then user is disabled in application
    And active sessions are terminated
```

## Security

### MFA Enforcement
[ ] Fulfilled Scenario
```gherkin
Scenario: MFA challenge via IdP
    Given user login requires MFA
    When user enters correct password
    Then MFA challenge is presented
    And access granted only after MFA success
```

### Logout
[ ] Fulfilled Scenario
```gherkin
Scenario: Single logout
    Given user is logged in
    When user clicks "Logout"
    Then local session is cleared
    And user is redirected to login page
```

[ ] Fulfilled Scenario
```gherkin
Scenario: Global logout (SLO)
    Given user is logged in to multiple apps
    When user logs out from one app
    Then all sessions across apps are terminated
```

---

[Planning Document](../sso_plan_draft.md#22-acceptance-criteria-ac)
