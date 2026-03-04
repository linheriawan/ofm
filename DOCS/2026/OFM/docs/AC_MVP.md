# Minimum Viable Product (MVP)

- **Meeting Room Booking**: 
  * [✓] Room reservation
  * [✓] Online/offline/hybrid meeting support
- **Transportation Management**: 
  * [✓] Transportation reservation 
  * [ ] Company car scheduling with driver assignment
  * [✓] Voucher allocation (Gojek, Grab, etc.)
- [ ] **Multi-Entity Support**: Fit for holding company with subsidiaries
- [ ] **SSO**: [Brief description + business value]
- [ ] **SCIM**: [Brief description + business value]
- [ ] **Display Device**: Works on Display Device Browser

# Acceptance Criteria

## Meeting Room Booking

## Transportation Management

## Multi-Entity Support

## SSO
### Successful SSO login
[ ] Fulfilled Scenario
```gherkin
Scenario: Successful login with valid credentials
    Given user is on login page
    When user enters valid email/password and clicks "Login"
    Then user is redirected to dashboard
    And session token is stored securely
```


## SCIM

## Display Device
### Device can run application
[ ] Fulfilled Scenario
```gherkin
Scenario: Device can run application
    Given user is on login page
    When user enters valid email/password and clicks "Login"
    Then user is redirected to dashboard
```
### Device Assignment
[ ] Fulfilled Scenario
```gherkin
Scenario: Device Assignment
    Given user is on login page
    When user enters valid email/password and clicks "Login"
    Then user is redirected to dashboard
```
### Device Can Display Room Information 
[ ] Fulfilled Scenario
```gherkin
Scenario: Device Can Display Room Information 
    Given user is on login page
    When user enters valid email/password and clicks "Login"
    Then user is redirected to dashboard
    And session token is stored securely
```

[Planning Document](../plan_draft_ofm.md#22-acceptance-criteria-ac)