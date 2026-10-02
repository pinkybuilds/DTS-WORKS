# DEFRA Receipt of Waste — Production Approval Testing

## Test Environment

Environment: DEFRA test environment

API:
Receipt of Waste API

Test start date:
2026-09-02

---

## Production Approval Test Matrix

| Scenario | Description | Expected Result | WTID / Timestamp | Result |
|---|---|---|---|---|
| R01 | Basic Waste Receipt - Single Waste Item | Created + WTID | | |
| R02 | Basic Waste Receipt - Multiple Waste Items | Created + WTID | | |
| R03 | Basic Waste Receipt - Means of Transport Road | Created + WTID | | |
| R04 | Basic Waste Receipt - No Disposal or Recovery Codes | Created + WTID + warning | | |
| R05 | Basic Waste Receipt - Multiple Disposal or Recovery Codes | Created + WTID | | |
| R07 | Basic Waste Receipt - Multiple EWC Codes | Created + WTID | | |
| C01 | No Carrier Registration Number + No Reason | Rejected | | |
| C02 | No Carrier Registration Number + Reason | Created + WTID | | |
| B01 | Broker/Dealer | Created + WTID | | |
| P01 | POPs Waste Receipt - Multiple POPs Components | Created + WTID | | |
| H01 | Hazardous Waste Receipt - Multiple Hazardous Components | Created + WTID | | |
| H02 | Hazardous + No Consignment Note Code + No Reason | Rejected | | |
| H03 | Hazardous + No Consignment Note Code + Reason | Created + WTID | | |
| X01 | Hazardous + POPs Waste Receipt | Created + WTID | | |