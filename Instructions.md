
I want to build a simple web app (React frontend, Node.js/Express backend) that displays a  Map of Singapore with real-time transport data. Please draft the code based on these requirements:

Map Markers: Plot all bus stops and MRT stations. Use different icons for each.
MRT Crowd Feature: When an MRT station is clicked, show a popup/info-window with the current crowd level (Green/Yellow/Orange/Red).
Bus Arrival Feature: When a bus stop is clicked, fetch and show the next 3 arrival times for all services at that stop.
Search/Filter: A simple toggle to show/hide MRT stations vs. Bus stops.

1. Tech Stack & APIs
    Frontend: React with google-maps-react or @react-google-maps/api.
    Backend: Node.js/Express to handle API requests (to avoid CORS issues).
    Maps: Google Maps JavaScript API.
    Data Sources (LTA DataMall):

In my DATA folder, you will find:
- LTABusStop.geojson -- contains the geojson of all the bus stop locations in Singapore
- LTAMRTStationExitGEOJSON - geojson of all the MRT exits in Singapore


URL https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival
Description Returns real-time Bus Arrival information of Bus Services at a queried Bus Stop,
including Est. Arrival Time, Est. Current Location, Est. Current Load.
Update Freq 20 seconds
API Call:
https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139

URL https://datamall2.mytransport.sg/ltaodataservice/PCDRealTime?TrainLine=CCL
Description Returns real-time MRT/LRT station crowdedness level of a particular train network line
Update Freq 10 minutes
Attributes Description Example
Station Station code EW13
StartTime The start of the time interval 2021-09-
15T09:40:00+08:00
EndTime The end of the time interval 2021-09-
15T09:50:00+08:00
CrowdLevel The crowdedness level indicates:
• l: low
• h: high
• m: moderate
PARAMETER: TrainLine

2. Handling the "MRT Crowd" API
The StationCrowdDensity API is unique—you have to query by Train Line (e.g., EWL for East-West Line), not by individual station.
    Strategy: Your backend should fetch all lines once every 10 minutes (the API refresh rate) and map the data to the specific station names on your frontend.



=======================
API Keys:
    data.gov.sg == 'v2:3b9fa915576eda9acc8bc757c838e9c58b2904408e575d7dd7d45c2f69dd7c16:uQWI1IxsVo05vQNbR9fTTjv2_f80GJGx'
    Guide == 'https://guide.data.gov.sg/developer-guide/api-overview/api-rate-limits'

    LTA API Account Key == gCjGhL+VTIWg8QlLwVQPYA==
    guide == 'https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf'

    LTA SDK Account Key == 425f7be8703658b004dcccbad5932564
    guide == 'https://datamall.lta.gov.sg/content/dam/datamall/pdf/Extended_OBU_Library_SDK_Developer_Guide.pdf'
