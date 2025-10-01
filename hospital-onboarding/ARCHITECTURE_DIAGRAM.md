# GrandPro HMSO - Detailed Architecture Diagrams

## 1. SYSTEM ARCHITECTURE - LAYERED VIEW

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACES                                 │
├────────────────┬────────────────┬────────────────┬──────────────────────────┤
│  Hospital      │  Patient        │  Admin         │  Partner                 │
│  Portal        │  Portal         │  Dashboard     │  APIs                   │
│  • React 18.3  │  • React PWA    │  • React Admin │  • REST/GraphQL         │
│  • Tailwind    │  • Mobile First │  • Charts      │  • Webhooks             │
└────────────────┴────────────────┴────────────────┴──────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY & MIDDLEWARE                           │
├──────────────────────────────────────────────────────────────────────────────┤
│  • Next.js API Routes        • Rate Limiting (60 req/min)                   │
│  • JWT Authentication        • CORS Configuration                           │
│  • Request Validation        • API Versioning                               │
│  • Error Handling           • Request/Response Logging                      │
└──────────────────────────────────────────────────────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                          BUSINESS LOGIC MODULES                              │
├─────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│  Onboarding │  CRM         │  Hospital    │  Operations  │  Partner        │
│  Module     │  Module      │  Management  │  Centre      │  Integration    │
├─────────────┼──────────────┼──────────────┼──────────────┼─────────────────┤
│ • Apps      │ • Patients   │ • EMR        │ • Monitoring │ • Insurance     │
│ • Scoring   │ • Owners     │ • Billing    │ • Alerts     │ • Pharmacy      │
│ • Contracts │ • Campaigns  │ • Inventory  │ • Analytics  │ • Telemedicine  │
│ • Documents │ • Loyalty    │ • HR/Payroll │ • Projects   │ • Compliance    │
└─────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         DATA & ANALYTICS LAYER                               │
├────────────────────────┬─────────────────────┬──────────────────────────────┤
│  ML/AI Services        │  Analytics Engine   │  Data Lake                   │
│  • Triage Bot          │  • Real-time        │  • Raw Data Storage          │
│  • Risk Scoring        │  • Predictive       │  • ETL Pipelines             │
│  • Fraud Detection     │  • Historical       │  • Data Warehouse            │
│  • Demand Forecast     │  • Custom Reports   │  • Data Marts                │
└────────────────────────┴─────────────────────┴──────────────────────────────┘
                                    ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           DATA PERSISTENCE LAYER                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                     PostgreSQL 17 (Neon Cloud)                               │
├────────────────────────┬─────────────────────┬──────────────────────────────┤
│  14 Schemas            │  87 Tables          │  Security Features           │
│  • analytics           │  • Normalized       │  • Row-level Security        │
│  • billing             │  • Indexed          │  • Encryption (AES-256)      │
│  • crm                 │  • Partitioned      │  • Audit Triggers            │
│  • emr                 │  • Foreign Keys     │  • Access Controls           │
└────────────────────────┴─────────────────────┴──────────────────────────────┘
```

## 2. MODULE INTERACTION DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                      MODULE INTERACTIONS                         │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │   Digital    │────────────┐
    │   Sourcing   │            │
    └──────────────┘            ▼
                        ┌──────────────┐      ┌──────────────┐
                        │  Hospital    │◄────►│     CRM      │
                        │  Management  │      │  Management  │
                        └──────────────┘      └──────────────┘
                                │                     │
                                ▼                     ▼
                        ┌──────────────┐      ┌──────────────┐
                        │  Operations  │      │   Partner    │
                        │    Centre    │◄────►│ Integration  │
                        └──────────────┘      └──────────────┘
                                │                     │
                                └──────┬──────────────┘
                                       ▼
                              ┌──────────────┐
                              │  Analytics   │
                              │   & ML       │
                              └──────────────┘
                                       │
                                       ▼
                              ┌──────────────┐
                              │   Security   │
                              │ & Compliance │
                              └──────────────┘

Legend:
──► Data Flow
◄─► Bidirectional Communication
```

## 3. DATA FLOW ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA FLOW ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

User Input                 Processing              Storage
─────────────             ─────────────           ─────────────
                              
[Web Portal]───┐                                 ┌─>[PostgreSQL]
               │         ┌─────────────┐         │
[Mobile App]───┼────────►│   API       │─────────┤
               │         │   Gateway   │         │
[API Client]───┘         └─────────────┘         └─>[Data Lake]
                                │
                                ▼
                    ┌───────────────────┐
                    │  Business Logic   │
                    │  • Validation      │
                    │  • Processing      │
                    │  • Transformation  │
                    └───────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
            ┌──────────────┐       ┌──────────────┐
            │  Synchronous │       │ Asynchronous │
            │  Processing  │       │  Processing  │
            │              │       │              │
            │ • CRUD Ops   │       │ • Analytics  │
            │ • Queries    │       │ • Reports    │
            │ • Real-time  │       │ • ML Jobs    │
            └──────────────┘       └──────────────┘
```

## 4. SECURITY ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────┘

                        ┌─────────────┐
                        │   Users     │
                        └──────┬──────┘
                               │
                    ┌──────────▼──────────┐
                    │   WAF & DDoS        │
                    │   Protection        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   SSL/TLS           │
                    │   Termination       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Authentication    │
                    │   • JWT Tokens      │
                    │   • OAuth 2.0       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Authorization     │
                    │   • RBAC           │
                    │   • Permissions    │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API Gateway       │
                    │   • Rate Limiting   │
                    │   • Input Validation│
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Application       │
                    │   • Business Logic  │
                    │   • Data Processing │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Data Layer        │
                    │   • Encryption      │
                    │   • Row-Level Sec  │
                    └─────────────────────┘

Security Controls at Each Layer:
• Network: Firewall, IDS/IPS
• Application: Input validation, CSRF protection
• Data: Encryption at rest & in transit
• Audit: Comprehensive logging
```

## 5. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                   DEPLOYMENT ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────┘

Production Environment
─────────────────────

┌──────────────────────────────────────────────────────────────┐
│                        CLOUD REGION                          │
│                        (us-east-1)                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────┐      ┌────────────────┐                │
│  │  Load Balancer │      │      CDN       │                │
│  │  (HTTPS/443)   │      │  (CloudFlare)  │                │
│  └────────┬───────┘      └────────────────┘                │
│           │                                                  │
│  ┌────────▼───────────────────────────────┐                │
│  │         Application Servers            │                │
│  ├────────────────────────────────────────┤                │
│  │  Node 1  │  Node 2  │  Node 3         │                │
│  │  (Active) │  (Active) │  (Standby)     │                │
│  └────────────────┬───────────────────────┘                │
│                   │                                         │
│  ┌────────────────▼───────────────────────┐                │
│  │         Database Cluster               │                │
│  ├────────────────────────────────────────┤                │
│  │  Primary  │  Read Replica │  Backup   │                │
│  │  (Write)  │  (Read Only)  │  (Cold)   │                │
│  └────────────────────────────────────────┘                │
│                                                              │
│  ┌────────────────────────────────────────┐                │
│  │         Support Services               │                │
│  ├────────────────────────────────────────┤                │
│  │  Redis   │  Queue   │  Storage        │                │
│  │  Cache   │  Service │  (S3)           │                │
│  └────────────────────────────────────────┘                │
└──────────────────────────────────────────────────────────────┘

Disaster Recovery Site (us-west-2) - Standby
```

## 6. INTEGRATION ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                   INTEGRATION ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────────┘

                    GrandPro HMSO Platform
                    ─────────────────────
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  Insurance   │   │   Pharmacy   │   │ Telemedicine │
│   Partners   │   │   Suppliers  │   │  Providers   │
├──────────────┤   ├──────────────┤   ├──────────────┤
│ • NHIS       │   │ • MedSupply  │   │ • TeleDoc    │
│ • HMO Lagos  │   │ • PharmaCo   │   │ • MedConsult │
│ • AXA        │   │ • DrugMart   │   │ • eHealth    │
│ • Hygeia     │   │ • MediStore  │   │              │
└──────────────┘   └──────────────┘   └──────────────┘
       │                   │                   │
       │                   │                   │
       ▼                   ▼                   ▼
┌──────────────────────────────────────────────────────┐
│              Integration Methods                      │
├──────────────────────────────────────────────────────┤
│ • REST APIs      • Webhooks       • Message Queue   │
│ • SOAP/XML       • FTP/SFTP       • Database Link   │
│ • HL7/FHIR       • Real-time Sync • Batch Process   │
└──────────────────────────────────────────────────────┘
```

---

**Document Version**: 1.0.0  
**Last Updated**: September 30, 2025  
**Status**: APPROVED AND IMPLEMENTED
