# Technology

- Svelte 5
- Typesafe typescript
- mongodb Atlas
- bun runtime
- keycloak/sso (to be implement later)
- Leaflet.js + OpenStreetMap (for mapping)

# Development Status

## Completed Features
- ✅ Dashboard with statistics and quick actions
- ✅ Navigation layout with dropdown menus
- ✅ Transportation overview page
- ✅ Meeting room overview page
- ✅ Transportation request form with geolocation and map picker
- ✅ Meeting room booking form with participant count
- ✅ Room display screen for tablets/Raspberry Pi
- ✅ Calendar views for meeting rooms and vehicles/drivers
- ✅ Round trip support for voucher allocation
- ✅ OpenStreetMap integration for company car bookings
- ✅ Calendar invitation (.ics) notification

## Pending Development
- [ ] Backend API implementation (SvelteKit API routes)
- [ ] MongoDB CRUD operations for all collections
- [ ] Authentication & authorization (JWT + role-based access)
- [ ] Admin approval workflow for requests
- [ ] Real-time GPS tracking integration (Arduino + GPS module)
- [ ] OBD-II data collection and monitoring
- [ ] Actual .ics calendar file generation and email sending
- [ ] Voucher allocation management for admins
- [ ] Driver/vehicle scheduling algorithm
- [ ] Meeting room availability conflict detection
- [ ] Online meeting platform integration (Zoom/Google Meet/Teams)
- [ ] License usage tracking and limits
- [ ] Catering order management workflow
- [ ] Notification system (email, push, in-app)
- [ ] QR/NFC check-in system for room tablets
- [ ] WebSocket for real-time updates
- [ ] Reporting and analytics dashboard
- [ ] Multi-entity/company support implementation
- [ ] Regional admin scoping
- [ ] Recurring meeting scheduler
- [ ] Cancellation and modification workflows
- [ ] Excel export functionality
- [ ] Mobile responsive optimization
- [ ] Unit and integration testing
- [ ] Documentation (API docs, user guide)

# Objective

- **Manage Employee Transportation Support**:
    - Admin need to allocate voucher(from Transportation Company/Go-Car) from employee request.
    - Admin need to schedule driver and car to transport employee based on empleyee booking.
    - having dashboard of assets(car/driver) and voucher utilization to support employee productivity
    - we will install arduino with GPS and OBD reader on each car(but what about BYD ev, is it will be different?)
- **Meeting Booking**:
    - admin need to manage booking to create (link for on-line meeting), or prepare physical room, facility, snack/lunch (for off-line meeting)
    - global admin need to see utilization of license, or facility of organisation meeting.
    - admin is regionally scooped (may have many location to manage)
    - tablet/raspberry pi zero w will be placed on in front of each rooms for displaying meeting title, and meeting attendance confirmation
- can be implemented for multi-entities company(Holding and its subsidiaries)

# Business Process

## 1. Employee Transportation Support Process

```mermaid
flowchart TD
    Start([Employee needs transport]) --> CheckType{Type of<br/>Transport?}

    CheckType -->|Voucher| ReqVoucher[Request Voucher]
    CheckType -->|Company Car| ReqCar[Request Company Car]

    ReqVoucher --> AdminReviewV{Admin Reviews<br/>Voucher Request}
    AdminReviewV -->|Approved| AllocateV[Allocate Voucher<br/>from Pool]
    AdminReviewV -->|Rejected| NotifyRejectV[Notify Employee]
    AllocateV --> DistributeV[Distribute Voucher<br/>to Employee]
    DistributeV --> UseV[Employee Uses<br/>Voucher]
    UseV --> TrackV[Track Voucher<br/>Usage]

    ReqCar --> AdminReviewC{Admin Reviews<br/>Car Request}
    AdminReviewC -->|Approved| CheckAvail{Check Car/Driver<br/>Availability}
    AdminReviewC -->|Rejected| NotifyRejectC[Notify Employee]
    CheckAvail -->|Available| ScheduleCar[Schedule Car<br/>& Driver]
    CheckAvail -->|Not Available| FindAlt{Find Alternative?}
    FindAlt -->|Yes| OfferAlt[Offer Voucher/Other<br/>Time Slot]
    FindAlt -->|No| NotifyRejectC
    ScheduleCar --> NotifyDriver[Notify Driver]
    NotifyDriver --> NotifyEmp[Notify Employee]
    NotifyEmp --> CarTrip[Car Trip Executed]
    CarTrip --> GPSTracking[GPS & OBD<br/>Tracking]
    GPSTracking --> TripComplete[Trip Completed]
    TripComplete --> UpdateAsset[Update Asset<br/>Availability]

    TrackV --> Dashboard[Update Dashboard]
    UpdateAsset --> Dashboard
    Dashboard --> End([End])
    NotifyRejectV --> End
    NotifyRejectC --> End
    OfferAlt --> End
```

## 2. Meeting Room Booking Process

```mermaid
flowchart TD
    Start([Employee needs meeting]) --> CheckMeetingType{Meeting Type?}

    CheckMeetingType -->|Online| ReqOnline[Request Online<br/>Meeting]
    CheckMeetingType -->|Offline| ReqOffline[Request Physical<br/>Room]
    CheckMeetingType -->|Hybrid| ReqHybrid[Request Hybrid<br/>Meeting]

    ReqOnline --> CheckLicense{Check License<br/>Availability}
    CheckLicense -->|Available| CreateLink[Create Meeting<br/>Link]
    CheckLicense -->|Not Available| QueueOnline[Queue Request/<br/>Find Alternative]
    CreateLink --> NotifyOnline[Notify Requestor<br/>& Participants]

    ReqOffline --> CheckRoom{Check Room<br/>Availability}
    ReqHybrid --> CheckRoom
    CheckRoom -->|Available| BookRoom[Book Room]
    CheckRoom -->|Not Available| FindAltRoom{Find Alternative<br/>Room/Time?}
    FindAltRoom -->|Yes| OfferAlt[Offer Alternative]
    FindAltRoom -->|No| NotifyReject[Notify Rejection]
    BookRoom --> CheckFacility{Facilities<br/>Needed?}
    CheckFacility -->|Yes| ArrangeFacility[Arrange Projector/<br/>Whiteboard/etc]
    CheckFacility -->|No| CheckCatering
    ArrangeFacility --> CheckCatering{Catering<br/>Needed?}
    CheckCatering -->|Yes| OrderCatering[Order Snacks/<br/>Lunch]
    CheckCatering -->|No| ConfirmBooking
    OrderCatering --> ConfirmBooking[Confirm Booking]

    ReqHybrid --> CreateLink
    ConfirmBooking --> NotifyAll[Notify Requestor<br/>& Participants]
    CreateLink --> SyncHybrid{Is Hybrid?}
    SyncHybrid -->|Yes| ConfirmBooking
    SyncHybrid -->|No| NotifyOnline

    NotifyAll --> UpdateTablet[Update Room<br/>Tablet Display]
    NotifyOnline --> Meeting[Meeting Conducted]
    UpdateTablet --> Meeting
    Meeting --> CheckIn[Attendance Check-in<br/>via Tablet]
    CheckIn --> MeetingEnd[Meeting Ends]
    MeetingEnd --> UpdateUtil[Update Utilization<br/>Dashboard]
    UpdateUtil --> End([End])

    QueueOnline --> End
    OfferAlt --> End
    NotifyReject --> End
```

## 3. Admin Dashboard & Monitoring Process

```mermaid
flowchart TD
    Start([Admin Access<br/>Dashboard]) --> SelectView{Select View}

    SelectView -->|Transport| TransDash[Transportation<br/>Dashboard]
    SelectView -->|Meeting| MeetDash[Meeting<br/>Dashboard]
    SelectView -->|Global| GlobalDash[Global Overview<br/>Dashboard]

    TransDash --> ViewTrans{View What?}
    ViewTrans -->|Assets| AssetView[Car Fleet Status<br/>Driver Availability]
    ViewTrans -->|Vouchers| VoucherView[Voucher Pool<br/>Allocation<br/>Usage Stats]
    ViewTrans -->|Requests| TransReqView[Pending Requests<br/>Scheduled Trips]
    ViewTrans -->|GPS| GPSView[Real-time GPS<br/>Tracking<br/>OBD Data]

    AssetView --> TakeAction{Need Action?}
    VoucherView --> TakeAction
    TransReqView --> TakeAction
    GPSView --> TakeAction

    MeetDash --> ViewMeet{View What?}
    ViewMeet -->|Rooms| RoomView[Room Availability<br/>Utilization Rate]
    ViewMeet -->|Licenses| LicenseView[Online Meeting<br/>License Usage]
    ViewMeet -->|Requests| MeetReqView[Pending Requests<br/>Upcoming Meetings]
    ViewMeet -->|Facilities| FacilityView[Facility Usage<br/>Catering Orders]

    RoomView --> TakeAction
    LicenseView --> TakeAction
    MeetReqView --> TakeAction
    FacilityView --> TakeAction

    GlobalDash --> MultiEntity[View Multi-entity<br/>Consolidated Data]
    MultiEntity --> CompareUtil[Compare Utilization<br/>Across Entities]
    CompareUtil --> TakeAction

    TakeAction -->|Yes| ProcessAction[Approve/Reject<br/>Allocate/Schedule<br/>Adjust Resources]
    TakeAction -->|No| Continue{Continue<br/>Monitoring?}
    ProcessAction --> Notify[Send Notifications]
    Notify --> UpdateDB[Update Database]
    UpdateDB --> Continue
    Continue -->|Yes| SelectView
    Continue -->|No| End([End])
```

## 4. IoT Integration Process

```mermaid
flowchart TD
    Start([IoT Devices]) --> DevType{Device Type}

    DevType -->|Car Arduino| GPSModule[GPS Module]
    DevType -->|Car Arduino| OBDReader[OBD-II Reader]
    DevType -->|Room Tablet| TabletApp[Tablet/Pi Zero W<br/>Display App]

    GPSModule --> CollectGPS[Collect GPS Data<br/>Location<br/>Speed<br/>Route]
    OBDReader --> CollectOBD[Collect OBD Data<br/>Fuel/Battery<br/>Engine Status<br/>Diagnostics]

    CollectGPS --> SendData[Send Data to<br/>Cloud Server]
    CollectOBD --> SendData
    SendData --> ValidateData{Validate Data}
    ValidateData -->|Valid| StoreDB[(Store in<br/>MongoDB)]
    ValidateData -->|Invalid| LogError[Log Error]
    LogError --> Alert[Alert Admin]

    StoreDB --> UpdateDash[Update Real-time<br/>Dashboard]
    UpdateDash --> Analyze[Analyze Patterns<br/>Usage<br/>Maintenance Needs]

    TabletApp --> ConnectServer[Connect to<br/>Server via API]
    ConnectServer --> FetchSchedule[Fetch Room<br/>Schedule]
    FetchSchedule --> DisplayInfo[Display Meeting<br/>Info]
    DisplayInfo --> WaitCheckin{Wait for<br/>Check-in}
    WaitCheckin -->|Participant Arrives| ScanQR[Scan QR/NFC/<br/>Manual Check-in]
    ScanQR --> RecordAttend[Record Attendance]
    RecordAttend --> UpdateServer[Update Server]
    UpdateServer --> DisplayInfo
    WaitCheckin -->|Meeting Ends| ClearDisplay[Clear Display]

    Analyze --> Report[Generate Reports<br/>& Insights]
    ClearDisplay --> FetchSchedule
    Report --> End([End])
    Alert --> End
```

# Additional Information Needed

## 1. Stakeholders & Roles
- key stakeholders: GA
- Define user roles and permissions:
  - Global Admin (multi-entity access)
  - Regional Admin (location-specific)
  - Department Admin
  - Employee (requestor)
  - Driver
  - Super Admin
- Approval workflow hierarchy

## 2. Business Rules & Policies
- **Transportation:**
  - Voucher allocation criteria (position level, frequency limits, amount limits)
  - Car booking priority rules (executive vs general employee)
  - Advance booking requirements (how many days/hours in advance?)
  - Cancellation policies: Just enable/update the Car status as available
  - Emergency/urgent request handling
  - Overtime/after-hours usage policies: need Advance booking
- **Meeting Rooms:**
  - Maximum booking duration (8 Hours)
  - Advance booking window (min/max days ahead)
  - Recurring meeting policies (Need Approvals from Super Admin)
  - Cancellation/modification deadlines (need re-approval from admin)
  - No-show penalties/None
  - Room capacity vs participant count rules (each room may have different capacity)
  - Catering order lead time

## 3. Integration Requirements
- **Authentication & Authorization:**
  - SSO/LDAP/Active Directory integration? 
  - Existing HR system integration for employee data?
- **External Services:**
  - Which ride-hailing providers? (Gojek, Grab, Uber?)
  - API documentation and credentials
  - Video conferencing platforms (Zoom, Google Meet, MS Teams?)
  - License management APIs
- **Notification Channels:**
  - Email provider (SMTP settings)
  - Push notifications?
  - In-app notifications?
  - Telegram/WhatsApp integration

## 4. Data & Reporting Requirements
- **KPIs to Track:**
  - Voucher utilization rate
  - Car/driver utilization rate
  - Average trip duration/distance
  - Meeting room occupancy rate
  - License usage efficiency
  - Cost per employee transportation
  - Popular routes/times
  - No-show rates
- **Reports Needed:**
  - Daily/weekly/monthly utilization reports
  - Cost analysis reports
  - Maintenance schedule (based on OBD data)
  - Carbon footprint/sustainability metrics
  - Department-wise allocation reports
- **Data Retention:**
  - How long to keep historical data?
  - Archive policies

## 5. Hardware & Infrastructure
- **Transportation IoT:**
  - Arduino model and specifications
  - GPS module specifications
  - OBD-II reader compatibility (standard vs EV vehicles like BYD)
  - Note: EVs may need different protocols (CANbus vs OBD-II)
  - SIM cards for data transmission?
  - Power supply method
  - Installation vendor
- **Room Display:**
  - Tablet specifications or Raspberry Pi Zero W?
  - Mounting solutions
  - Power over Ethernet (PoE) or battery?
  - Display size requirements
  - Touch screen functionality needed?
  - QR code/NFC reader integration?

## 6. Security & Compliance
- Data privacy regulations (GDPR, local laws)
- Employee location tracking consent
- Data encryption (at rest and in transit)
- Audit trail requirements
- Backup and disaster recovery plan
- Access control and authentication methods

## 7. Scalability & Performance
- Expected number of users (per entity/total)
- Expected number of entities (companies)
- Expected number of cars/drivers
- Expected number of meeting rooms
- Concurrent booking capacity
- Real-time tracking data volume (GPS frequency)
- Peak usage times

## 8. Budget & Timeline
- Development timeline and milestones
- Budget for:
  - Development
  - Hardware (Arduino, tablets, accessories)
  - Cloud infrastructure (MongoDB Atlas tier)
  - External service subscriptions (ride-hailing APIs, video conferencing)
  - Maintenance and support
- ROI expectations

## 9. Pilot & Rollout Plan
- Pilot scope (which entity/location first?)
- Pilot duration
- Success criteria for pilot
- Phased rollout approach
- Training plan for admins and users
- Change management strategy

## 10. Support & Maintenance
- Support hours (24/7 or business hours?)
- SLA requirements
- Maintenance windows
- Incident escalation process
- Help desk integration
- User documentation requirements