// Ordered station lists per MRT/LRT line
// Names match stationCodeMapping.js keys (= GeoJSON STATION_NA values)
// Order follows station code numbering

export const LINE_STATION_ORDER = {
  NSL: [
    "JURONG EAST MRT STATION",        // NS1
    "BUKIT BATOK MRT STATION",        // NS2
    "BUKIT GOMBAK MRT STATION",       // NS3
    "CHOA CHU KANG MRT STATION",      // NS4
    "YEW TEE MRT STATION",            // NS5
    "KRANJI MRT STATION",             // NS7
    "MARSILING MRT STATION",          // NS8
    "WOODLANDS MRT STATION",          // NS9
    "ADMIRALTY MRT STATION",          // NS10
    "SEMBAWANG MRT STATION",          // NS11
    "CANBERRA MRT STATION",           // NS12
    "YISHUN MRT STATION",             // NS13
    "KHATIB MRT STATION",             // NS14
    "YIO CHU KANG MRT STATION",       // NS15
    "ANG MO KIO MRT STATION",         // NS16
    "BISHAN MRT STATION",             // NS17
    "BRADDELL MRT STATION",           // NS18
    "TOA PAYOH MRT STATION",          // NS19
    "NOVENA MRT STATION",             // NS20
    "NEWTON MRT STATION",             // NS21
    "ORCHARD MRT STATION",            // NS22
    "SOMERSET MRT STATION",           // NS23
    "DHOBY GHAUT MRT STATION",        // NS24
    "CITY HALL MRT STATION",          // NS25
    "RAFFLES PLACE MRT STATION",      // NS26
    "MARINA BAY MRT STATION",         // NS27
    "MARINA SOUTH PIER MRT STATION",  // NS28
  ],
  EWL: [
    "PASIR RIS MRT STATION",          // EW1
    "TAMPINES MRT STATION",           // EW2
    "SIMEI MRT STATION",              // EW3
    "TANAH MERAH MRT STATION",        // EW4
    "BEDOK MRT STATION",              // EW5
    "KEMBANGAN MRT STATION",          // EW6
    "EUNOS MRT STATION",              // EW7
    "PAYA LEBAR MRT STATION",         // EW8
    "ALJUNIED MRT STATION",           // EW9
    "KALLANG MRT STATION",            // EW10
    "LAVENDER MRT STATION",           // EW11
    "BUGIS MRT STATION",              // EW12
    "CITY HALL MRT STATION",          // EW13
    "RAFFLES PLACE MRT STATION",      // EW14
    "TANJONG PAGAR MRT STATION",      // EW15
    "OUTRAM PARK MRT STATION",        // EW16
    "TIONG BAHRU MRT STATION",        // EW17
    "REDHILL MRT STATION",            // EW18
    "QUEENSTOWN MRT STATION",         // EW19
    "COMMONWEALTH MRT STATION",       // EW20
    "BUONA VISTA MRT STATION",        // EW21
    "DOVER MRT STATION",              // EW22
    "CLEMENTI MRT STATION",           // EW23
    "JURONG EAST MRT STATION",        // EW24
    "CHINESE GARDEN MRT STATION",     // EW25
    "LAKESIDE MRT STATION",           // EW26
    "BOON LAY MRT STATION",           // EW27
    "PIONEER MRT STATION",            // EW28
    "JOO KOON MRT STATION",           // EW29
    "GUL CIRCLE MRT STATION",         // EW30
    "TUAS CRESCENT MRT STATION",      // EW31
    "TUAS WEST ROAD MRT STATION",     // EW32
    "TUAS LINK MRT STATION",          // EW33
  ],
  CGL: [
    "TANAH MERAH MRT STATION",        // Branch from EW4
    "EXPO MRT STATION",               // CG1
    "CHANGI AIRPORT MRT STATION",     // CG2
  ],
  NEL: [
    "HARBOURFRONT MRT STATION",       // NE1
    "OUTRAM PARK MRT STATION",        // NE3
    "CHINATOWN MRT STATION",          // NE4
    "CLARKE QUAY MRT STATION",        // NE5
    "DHOBY GHAUT MRT STATION",        // NE6
    "LITTLE INDIA MRT STATION",       // NE7
    "FARRER PARK MRT STATION",        // NE8
    "BOON KENG MRT STATION",          // NE9
    "POTONG PASIR MRT STATION",       // NE10
    "WOODLEIGH MRT STATION",          // NE11
    "SERANGOON MRT STATION",          // NE12
    "KOVAN MRT STATION",              // NE13
    "HOUGANG MRT STATION",            // NE14
    "BUANGKOK MRT STATION",           // NE15
    "SENGKANG MRT STATION",           // NE16
    "PUNGGOL MRT STATION",            // NE17
  ],
  CCL: [
    "DHOBY GHAUT MRT STATION",        // CC1
    "BRAS BASAH MRT STATION",         // CC2
    "ESPLANADE MRT STATION",          // CC3
    "PROMENADE MRT STATION",          // CC4
    "NICOLL HIGHWAY MRT STATION",     // CC5
    "STADIUM MRT STATION",            // CC6
    "MOUNTBATTEN MRT STATION",        // CC7
    "DAKOTA MRT STATION",             // CC8
    "PAYA LEBAR MRT STATION",         // CC9
    "MACPHERSON MRT STATION",         // CC10
    "TAI SENG MRT STATION",           // CC11
    "BARTLEY MRT STATION",            // CC12
    "SERANGOON MRT STATION",          // CC13
    "LORONG CHUAN MRT STATION",       // CC14
    "BISHAN MRT STATION",             // CC15
    "MARYMOUNT MRT STATION",          // CC16
    "CALDECOTT MRT STATION",          // CC17
    "BOTANIC GARDENS MRT STATION",    // CC19
    "FARRER ROAD MRT STATION",        // CC20
    "HOLLAND VILLAGE MRT STATION",    // CC21
    "BUONA VISTA MRT STATION",        // CC22
    "ONE-NORTH MRT STATION",          // CC23
    "KENT RIDGE MRT STATION",         // CC24
    "HAW PAR VILLA MRT STATION",      // CC25
    "PASIR PANJANG MRT STATION",      // CC26
    "LABRADOR PARK MRT STATION",      // CC27
    "TELOK BLANGAH MRT STATION",      // CC28
    "HARBOURFRONT MRT STATION",       // CC29
  ],
  CEL: [
    "BAYFRONT MRT STATION",           // CE1
    "MARINA BAY MRT STATION",         // CE2
  ],
  DTL: [
    "BUKIT PANJANG MRT STATION",      // DT1
    "CASHEW MRT STATION",             // DT2
    "HILLVIEW MRT STATION",           // DT3
    "DT4",                             // DT3A (Hume)
    "BEAUTY WORLD MRT STATION",       // DT5
    "KING ALBERT PARK MRT STATION",   // DT6
    "SIXTH AVENUE MRT STATION",       // DT7
    "TAN KAH KEE MRT STATION",        // DT8
    "BOTANIC GARDENS MRT STATION",    // DT9
    "STEVENS MRT STATION",            // DT10
    "NEWTON MRT STATION",             // DT11
    "LITTLE INDIA MRT STATION",       // DT12
    "ROCHOR MRT STATION",             // DT13
    "BUGIS MRT STATION",              // DT14
    "PROMENADE MRT STATION",          // DT15
    "BAYFRONT MRT STATION",           // DT16
    "DOWNTOWN MRT STATION",           // DT17
    "TELOK AYER MRT STATION",         // DT18
    "CHINATOWN MRT STATION",          // DT19
    "FORT CANNING MRT STATION",       // DT20
    "BENCOOLEN MRT STATION",          // DT21
    "JALAN BESAR MRT STATION",        // DT22
    "BENDEMEER MRT STATION",          // DT23
    "GEYLANG BAHRU MRT STATION",      // DT24
    "MATTAR MRT STATION",             // DT25
    "MACPHERSON MRT STATION",         // DT26
    "UBI MRT STATION",                // DT27
    "KAKI BUKIT MRT STATION",         // DT28
    "BEDOK NORTH MRT STATION",        // DT29
    "BEDOK RESERVOIR MRT STATION",    // DT30
    "TAMPINES WEST MRT STATION",      // DT31
    "TAMPINES MRT STATION",           // DT32
    "TAMPINES EAST MRT STATION",      // DT33
    "UPPER CHANGI MRT STATION",       // DT34
    "EXPO MRT STATION",               // DT35
  ],
  TEL: [
    "WOODLANDS NORTH MRT STATION",    // TE1
    "WOODLANDS MRT STATION",          // TE2
    "WOODLANDS SOUTH MRT STATION",    // TE3
    "SPRINGLEAF MRT STATION",         // TE4
    "LENTOR MRT STATION",             // TE5
    "MAYFLOWER MRT STATION",          // TE6
    "BRIGHT HILL MRT STATION",        // TE7
    "UPPER THOMSON MRT STATION",      // TE8
    "CALDECOTT MRT STATION",          // TE9
    "STEVENS MRT STATION",            // TE11
    "NAPIER MRT STATION",             // TE12
    "ORCHARD BOULEVARD MRT STATION",  // TE13
    "ORCHARD MRT STATION",            // TE14
    "GREAT WORLD MRT STATION",        // TE15
    "HAVELOCK MRT STATION",           // TE16
    "OUTRAM PARK MRT STATION",        // TE17
    "MAXWELL MRT STATION",            // TE18
    "SHENTON WAY MRT STATION",        // TE19
    "MARINA BAY MRT STATION",         // TE20
    "MARINA SOUTH MRT STATION",       // TE21
    "GARDENS BY THE BAY MRT STATION", // TE22
    "TANJONG RHU MRT STATION",        // TE23
    "KATONG PARK MRT STATION",        // TE24
    "TANJONG KATONG MRT STATION",     // TE25
    "MARINE PARADE MRT STATION",      // TE26
    "MARINE TERRACE MRT STATION",     // TE27
    "SIGLAP MRT STATION",             // TE28
    "BAYSHORE MRT STATION",           // TE29
  ],
  BPL: [
    "CHOA CHU KANG LRT STATION",      // BP1
    "SOUTH VIEW LRT STATION",         // BP2
    "KEAT HONG LRT STATION",          // BP3
    "TECK WHYE LRT STATION",          // BP4
    "PHOENIX LRT STATION",            // BP5
    "BUKIT PANJANG LRT STATION",      // BP6
    "PETIR LRT STATION",              // BP7
    "PENDING LRT STATION",            // BP8
    "BANGKIT LRT STATION",            // BP9
    "FAJAR LRT STATION",              // BP10
    "SEGAR LRT STATION",              // BP11
    "JELAPANG LRT STATION",           // BP12
    "SENJA LRT STATION",              // BP13
    "CHOA CHU KANG LRT STATION",      // Loop back to BP1
  ],
  SLRT_EAST: [
    "SENGKANG MRT STATION",           // STC
    "COMPASSVALE LRT STATION",        // SE1
    "RUMBIA LRT STATION",             // SE2
    "BAKAU LRT STATION",              // SE3
    "KANGKAR LRT STATION",            // SE4
    "RANGGUNG LRT STATION",           // SE5
    "SENGKANG MRT STATION",           // Loop back
  ],
  SLRT_WEST: [
    "SENGKANG MRT STATION",           // STC
    "CHENG LIM LRT STATION",          // SW1
    "FARMWAY LRT STATION",            // SW2
    "KUPANG LRT STATION",             // SW3
    "THANGGAM LRT STATION",           // SW4
    "FERNVALE LRT STATION",           // SW5
    "LAYAR LRT STATION",              // SW6
    "TONGKANG LRT STATION",           // SW7
    "RENJONG LRT STATION",            // SW8
    "SENGKANG MRT STATION",           // Loop back
  ],
  PLRT_EAST: [
    "PUNGGOL MRT STATION",            // PTC
    "COVE LRT STATION",               // PE1
    "MERIDIAN LRT STATION",           // PE2
    "CORAL EDGE LRT STATION",         // PE3
    "RIVIERA LRT STATION",            // PE4
    "KADALOOR LRT STATION",           // PE5
    "OASIS LRT STATION",              // PE6
    "DAMAI LRT STATION",              // PE7
    "PUNGGOL MRT STATION",            // Loop back
  ],
  PLRT_WEST: [
    "PUNGGOL MRT STATION",            // PTC
    "SAM KEE LRT STATION",            // PW1
    "TECK LEE LRT STATION",           // PW2
    "PUNGGOL POINT LRT STATION",      // PW3
    "SAMUDERA LRT STATION",           // PW4
    "NIBONG LRT STATION",             // PW5
    "SUMANG LRT STATION",             // PW6
    "SOO TECK LRT STATION",           // PW7
    "PUNGGOL MRT STATION",            // Loop back
  ],
};

// Colors for line path rendering (using same keys as LINE_STATION_ORDER)
export const LINE_PATH_COLORS = {
  NSL: '#d42e12',
  EWL: '#009645',
  CGL: '#009645',
  NEL: '#9900aa',
  CCL: '#fa9e0d',
  CEL: '#fa9e0d',
  DTL: '#005ec4',
  TEL: '#9D5B25',
  BPL: '#748477',
  SLRT_EAST: '#748477',
  SLRT_WEST: '#748477',
  PLRT_EAST: '#748477',
  PLRT_WEST: '#748477',
};
