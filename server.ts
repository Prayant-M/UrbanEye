import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { Issue, IssueCategory, IssueStatus, LocationInfo, TimelineEvent, UserProfile, InsightCard } from './src/types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// In-memory Database
let issues: Issue[] = [
  {
    id: 'issue-101',
    title: 'Crater-sized Pothole on busy crossing',
    category: 'pothole',
    subType: 'road_damage_major',
    description: 'A massive pothole has opened up at the intersection of 80 Feet Road and 12th Main. It is extremely deep and causing motorists to swerve dangerously, especially during water logging.',
    severity: 4,
    priorityScore: 88,
    status: 'acknowledged',
    location: {
      lat: 12.9716,
      lng: 77.6412,
      address: 'Intersection of 80 Feet Rd and 12th Main, Koramangala 4th Block',
      ward: 'Ward 151 - Koramangala'
    },
    confirmations: 8,
    upvotes: 24,
    reportsCount: 3,
    reportIds: ['rep-1', 'rep-2', 'rep-3'],
    imageUrls: [
      'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'
    ],
    assignedDepartment: 'Public Works Department (PWD)',
    assignedOfficer: 'Officer Ramesh Kumar',
    eta: '2026-06-25',
    aiRationale: 'High-severity road hazard on a high-traffic arteriole road. Multiple community reports merged. Close proximity to Koramangala Public School increases safety risk, elevating priority score to 88.',
    aiThoughtProcess: [
      'Analyzing submitted photo... Identified a deep road depression with visible sub-base damage.',
      'Checking location metadata... Matches Koramangala arteriole crossway.',
      'Scanning nearby open reports... Found 2 similar submissions within 20 meters. Merging into single canonical issue.',
      'Calculating priority score: Base severity 4 * Traffic multiplier 1.5 + School buffer (+15) + High community feedback (+13) = 88.'
    ],
    timeline: [
      {
        status: 'pending_verification',
        timestamp: '2026-06-21T09:15:00Z',
        note: 'Issue reported by citizen Ananya S.',
        actor: 'Citizen'
      },
      {
        status: 'verified',
        timestamp: '2026-06-21T10:02:00Z',
        note: 'Auto-verified after receiving 3 community confirmations.',
        actor: 'UrbanEye System'
      },
      {
        status: 'acknowledged',
        timestamp: '2026-06-22T14:30:00Z',
        note: 'Assigned to Public Works Department (PWD). Slated for immediate repair.',
        actor: 'Officer Ramesh Kumar'
      }
    ],
    createdAt: '2026-06-21T09:15:00Z',
    updatedAt: '2026-06-22T14:30:00Z'
  },
  {
    id: 'issue-102',
    title: 'Severe Drinking Water Pipeline Leakage',
    category: 'water_leak',
    subType: 'water_main_burst',
    description: 'A clean water pipe burst is causing hundreds of gallons of drinking water to flood the street. Water has been shooting up like a geyser since last evening, eroding the sidewalk.',
    severity: 5,
    priorityScore: 94,
    status: 'in_progress',
    location: {
      lat: 12.9784,
      lng: 77.6408,
      address: 'Near Metro Pillar 124, Indiranagar Double Road',
      ward: 'Ward 80 - Indiranagar'
    },
    confirmations: 12,
    upvotes: 45,
    reportsCount: 4,
    reportIds: ['rep-4', 'rep-5'],
    imageUrls: [
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800'
    ],
    assignedDepartment: 'Water Supply & Sewerage Board (BWSSB)',
    assignedOfficer: 'Engineer Vikram Hegde',
    eta: '2026-06-24',
    aiRationale: 'Critical utility failure. Massive drinking water wastage. High flooding hazard in active commercial area. High-priority level assigned to arrest resource loss.',
    aiThoughtProcess: [
      'Analyzing photo... Confirmed high-pressure clean water leakage.',
      'Determining category: water_leak (critical main burst).',
      'Determining routing: Assigned to Water Supply & Sewerage Board (BWSSB).',
      'Assigned maximum severity level 5 due to continuous loss of precious drinking resource and pavement erosion risk.'
    ],
    timeline: [
      {
        status: 'pending_verification',
        timestamp: '2026-06-22T17:40:00Z',
        note: 'Issue reported by citizen Kartik M.',
        actor: 'Citizen'
      },
      {
        status: 'verified',
        timestamp: '2026-06-22T18:00:00Z',
        note: 'Verified with photo-proof attachment and community consensus.',
        actor: 'UrbanEye System'
      },
      {
        status: 'acknowledged',
        timestamp: '2026-06-22T19:15:00Z',
        note: 'BWSSB acknowledged the dispatch of repair truck #04.',
        actor: 'BWSSB Control Room'
      },
      {
        status: 'in_progress',
        timestamp: '2026-06-23T08:00:00Z',
        note: 'Excavation team on-site. Main valve shut off, pipe replacement underway.',
        actor: 'Engineer Vikram Hegde'
      }
    ],
    createdAt: '2026-06-22T17:40:00Z',
    updatedAt: '2026-06-23T08:00:00Z'
  },
  {
    id: 'issue-103',
    title: 'Broken and Exposed Overhead Power Line',
    category: 'broken_streetlight',
    subType: 'electrical_hazard',
    description: 'An overhead line snapped during the storm and is hanging dangerously low over the pedestrian pathway. Sparks were visible earlier. Extreme electrocution risk!',
    severity: 5,
    priorityScore: 98,
    status: 'verified',
    location: {
      lat: 12.9104,
      lng: 77.6186,
      address: 'Opposite Shell Fuel Station, HSR Layout Sector 3',
      ward: 'Ward 174 - HSR Layout'
    },
    confirmations: 15,
    upvotes: 62,
    reportsCount: 5,
    reportIds: ['rep-7', 'rep-8', 'rep-9'],
    imageUrls: [
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800'
    ],
    assignedDepartment: 'Electricity Supply Company (BESCOM)',
    assignedOfficer: 'Supervisor Manjunath K.',
    eta: '2026-06-23',
    aiRationale: 'Life-threatening electric hazard on a busy commercial sidewalk. Immediate containment and emergency dispatch recommended. Auto-promoted to critical queue.',
    aiThoughtProcess: [
      'High severity hazard recognized: live cables hanging under 2 meters over public walkway.',
      'BESCOM automatic alerts fired due to public electrocution risks.',
      'Scored priority at 98/100 to force instant dashboard notification for officers.'
    ],
    timeline: [
      {
        status: 'pending_verification',
        timestamp: '2026-06-23T10:05:00Z',
        note: 'Critical report filed with emergency tag.',
        actor: 'Citizen (Emergency Watch)'
      },
      {
        status: 'verified',
        timestamp: '2026-06-23T10:15:00Z',
        note: 'AI-verification model bypassed traditional vote waiting and auto-verified due to visual confirmation of heavy sparking hazard.',
        actor: 'UrbanEye System'
      }
    ],
    createdAt: '2026-06-23T10:05:00Z',
    updatedAt: '2026-06-23T10:15:00Z'
  },
  {
    id: 'issue-104',
    title: 'Illegal Commercial Garbage Dumping',
    category: 'garbage',
    subType: 'illegal_dumping',
    description: 'A local catering service is dumping large bins of wet food waste, plastic plates, and rotting material at the corner of the public park. Stench is unbearable, attracting dogs and rodents.',
    severity: 3,
    priorityScore: 65,
    status: 'resolved',
    location: {
      lat: 12.9220,
      lng: 77.6780,
      address: 'Outer Ring Road Corner, Bellandur Park Wall',
      ward: 'Ward 150 - Bellandur'
    },
    confirmations: 5,
    upvotes: 18,
    reportsCount: 1,
    reportIds: ['rep-11'],
    imageUrls: [
      'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800'
    ],
    resolvedImageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800',
    resolvedNote: 'BBMP health inspectors visited the spot. The catering service was identified and fined ₹5,000. Garbage has been entirely cleared, and a "No Littering" warning sign installed.',
    assignedDepartment: 'Municipal Corporation (BBMP Solid Waste)',
    assignedOfficer: 'Inspector Srinivas G.',
    aiRationale: 'Sanitation and public health concern near a park. Rated severity 3, assigned to BBMP Waste Management.',
    timeline: [
      {
        status: 'pending_verification',
        timestamp: '2026-06-19T08:00:00Z',
        note: 'Reported with photograph by citizen Meera N.',
        actor: 'Citizen'
      },
      {
        status: 'verified',
        timestamp: '2026-06-19T11:20:00Z',
        note: 'Community verified with 4 votes.',
        actor: 'Citizens'
      },
      {
        status: 'acknowledged',
        timestamp: '2026-06-20T09:00:00Z',
        note: 'Assigned to BBMP Ward Health Inspector.',
        actor: 'Municipal Admin'
      },
      {
        status: 'in_progress',
        timestamp: '2026-06-20T13:10:00Z',
        note: 'Sanitation truck deployed to clear garbage pile.',
        actor: 'Inspector Srinivas G.'
      },
      {
        status: 'resolved',
        timestamp: '2026-06-22T16:45:00Z',
        note: 'Garbage cleared. Area cleaned and disinfected. Before-and-after photo logged.',
        actor: 'Inspector Srinivas G.'
      }
    ],
    createdAt: '2026-06-19T08:00:00Z',
    updatedAt: '2026-06-22T16:45:00Z'
  },
  {
    id: 'issue-105',
    title: 'Clogged Drainage Causing Street Flooding',
    category: 'drainage',
    subType: 'storm_drain_block',
    description: 'The stormwater drain on this avenue is completely choked with plastic trash and silt. A light afternoon shower has caused water to collect up to knee-height, flooding garages of adjacent houses.',
    severity: 4,
    priorityScore: 78,
    status: 'pending_verification',
    location: {
      lat: 12.9845,
      lng: 77.5950,
      address: '7th Cross, Vasanth Nagar Main Road',
      ward: 'Ward 93 - Vasanth Nagar'
    },
    confirmations: 1,
    upvotes: 11,
    reportsCount: 1,
    reportIds: ['rep-14'],
    imageUrls: [
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'
    ],
    assignedDepartment: 'Stormwater Drain Division (SWD)',
    aiRationale: 'Flooding hazard obstructing local pedestrian and vehicular transit. Blocked storm sewer. Medium-high severity (4) due to rainwater accumulation risks in residential crawlspaces.',
    timeline: [
      {
        status: 'pending_verification',
        timestamp: '2026-06-23T11:50:00Z',
        note: 'Report filed by resident David L.',
        actor: 'Citizen'
      }
    ],
    createdAt: '2026-06-23T11:50:00Z',
    updatedAt: '2026-06-23T11:50:00Z'
  },

  // ─── Additional Synthetic Issues across Bangalore ──────────────────────
  {
    id: 'issue-106',
    title: 'Massive Sinkhole near Whitefield Bus Stop',
    category: 'pothole',
    subType: 'road_sinkhole',
    description: 'A large sinkhole has appeared on the main road near the Whitefield bus stop due to underground pipe erosion. Vehicles are being diverted through narrow bylanes causing massive traffic jams.',
    severity: 5,
    priorityScore: 92,
    status: 'verified',
    location: { lat: 12.9698, lng: 77.7500, address: 'Main Road, Near Whitefield Bus Stop', ward: 'Ward 85 - Whitefield' },
    confirmations: 10, upvotes: 38, reportsCount: 4, reportIds: ['rep-20', 'rep-21'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Public Works Department (PWD)',
    assignedOfficer: 'Engineer Prasad N.',
    eta: '2026-06-26',
    aiRationale: 'Critical road sinkhole on an arterial road. Underground pipe failure detected. High traffic zone with bus route dependency.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T07:30:00Z', note: 'Reported by morning commuter.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-22T08:15:00Z', note: 'Auto-verified with 5+ confirmations.', actor: 'UrbanEye System' }
    ],
    createdAt: '2026-06-22T07:30:00Z', updatedAt: '2026-06-22T08:15:00Z'
  },
  {
    id: 'issue-107',
    title: 'Overflowing Sewage on 4th T Block',
    category: 'drainage',
    subType: 'sewage_overflow',
    description: 'Raw sewage is overflowing from a manhole on 4th T Block, Jayanagar. The entire street is flooded with sewage water, making it impossible for pedestrians and vehicles to pass.',
    severity: 5,
    priorityScore: 90,
    status: 'in_progress',
    location: { lat: 12.9250, lng: 77.5830, address: '4th T Block, Jayanagar', ward: 'Ward 163 - Jayanagar' },
    confirmations: 9, upvotes: 35, reportsCount: 3, reportIds: ['rep-22', 'rep-23'],
    imageUrls: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Water Supply & Sewerage Board (BWSSB)',
    assignedOfficer: 'Engineer Suresh M.',
    eta: '2026-06-25',
    aiRationale: 'Critical public health hazard. Sewage overflow on a residential block affecting hundreds of families.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-21T06:00:00Z', note: 'Emergency report by resident.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-21T06:30:00Z', note: 'Verified with photo evidence.', actor: 'UrbanEye System' },
      { status: 'in_progress', timestamp: '2026-06-21T14:00:00Z', note: 'BWSSB crew deployed with suction tanker.', actor: 'Engineer Suresh M.' }
    ],
    createdAt: '2026-06-21T06:00:00Z', updatedAt: '2026-06-21T14:00:00Z'
  },
  {
    id: 'issue-108',
    title: 'Collapsed Retaining Wall on Sampige Road',
    category: 'pothole',
    subType: 'wall_collapse',
    description: 'A retaining wall adjacent to Sampige Road in Malleshwaram has partially collapsed, with debris spilling onto the road and blocking one lane of traffic.',
    severity: 4,
    priorityScore: 85,
    status: 'acknowledged',
    location: { lat: 12.9960, lng: 77.5700, address: 'Sampige Road, Malleshwaram', ward: 'Ward 57 - Malleshwaram' },
    confirmations: 7, upvotes: 22, reportsCount: 2, reportIds: ['rep-24'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Public Works Department (PWD)',
    aiRationale: 'Structural collapse posing traffic and pedestrian safety risk. Debris clearance and wall reconstruction needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T16:00:00Z', note: 'Wall collapse reported.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-22T16:30:00Z', note: 'Photo-verified. Debris visible.', actor: 'UrbanEye System' },
      { status: 'acknowledged', timestamp: '2026-06-23T09:00:00Z', note: 'PWD notified.', actor: 'Municipal Admin' }
    ],
    createdAt: '2026-06-22T16:00:00Z', updatedAt: '2026-06-23T09:00:00Z'
  },
  {
    id: 'issue-109',
    title: 'Broken Street Light Cluster — 500m Dark Stretch',
    category: 'broken_streetlight',
    subType: 'multiple_lamp_failure',
    description: 'A stretch of 500 meters on Rajajinagar 2nd Stage has gone completely dark. At least 8 street lights are non-functional, creating a dangerous zone for pedestrians after sunset.',
    severity: 4,
    priorityScore: 76,
    status: 'verified',
    location: { lat: 12.9880, lng: 77.5520, address: '2nd Stage, Rajajinagar', ward: 'Ward 46 - Rajajinagar' },
    confirmations: 6, upvotes: 19, reportsCount: 2, reportIds: ['rep-25'],
    imageUrls: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Electricity Supply Company (BESCOM)',
    aiRationale: 'Multiple lamp failures suggest sub-station issue rather than individual bulb failures. Dark stretch safety hazard.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T20:00:00Z', note: 'Reported after sunset.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-22T20:30:00Z', note: 'Confirmed by multiple residents.', actor: 'UrbanEye System' }
    ],
    createdAt: '2026-06-22T20:00:00Z', updatedAt: '2026-06-22T20:30:00Z'
  },
  {
    id: 'issue-110',
    title: 'Industrial Waste Dumped in Lake Bed',
    category: 'illegal_dumping',
    subType: 'industrial_waste',
    description: 'Unknown trucks have been dumping industrial chemical waste into the dry bed of Bellandur Lake near the tech park side. Strong chemical odor reported by residents within 500m radius.',
    severity: 5,
    priorityScore: 96,
    status: 'verified',
    location: { lat: 12.9340, lng: 77.6700, address: 'Near EcoSpace Tech Park, Bellandur Lake Bed', ward: 'Ward 150 - Bellandur' },
    confirmations: 14, upvotes: 55, reportsCount: 5, reportIds: ['rep-26', 'rep-27', 'rep-28'],
    imageUrls: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Karnataka State Pollution Control Board (KSPCB)',
    aiRationale: 'Environmental crime. Industrial waste in lake bed poses groundwater contamination risk. Requires KSPCB investigation and legal action.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-20T05:00:00Z', note: 'Night-time dumping activity photographed.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-20T07:00:00Z', note: 'Multiple photo confirmations from different angles.', actor: 'UrbanEye System' }
    ],
    createdAt: '2026-06-20T05:00:00Z', updatedAt: '2026-06-20T07:00:00Z'
  },
  {
    id: 'issue-111',
    title: 'Water Pipeline Leak Flooding BTM Layout',
    category: 'water_leak',
    subType: 'pipe_joint_failure',
    description: 'A major water pipeline joint has failed at the BTM Layout 2nd Stage, causing continuous water flow onto the road. The leak has been active for 3 days and has eroded the road shoulder.',
    severity: 4,
    priorityScore: 82,
    status: 'in_progress',
    location: { lat: 12.9160, lng: 77.6100, address: '2nd Stage Main Road, BTM Layout', ward: 'Ward 176 - BTM Layout' },
    confirmations: 8, upvotes: 28, reportsCount: 3, reportIds: ['rep-29', 'rep-30'],
    imageUrls: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Water Supply & Sewerage Board (BWSSB)',
    assignedOfficer: 'Engineer Priya R.',
    eta: '2026-06-25',
    aiRationale: 'Persistent water leak causing road erosion and wastage. Joint replacement required.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-20T09:00:00Z', note: 'Leak reported.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-20T10:00:00Z', note: 'Confirmed.', actor: 'UrbanEye System' },
      { status: 'in_progress', timestamp: '2026-06-22T11:00:00Z', note: 'Pipe excavation underway.', actor: 'Engineer Priya R.' }
    ],
    createdAt: '2026-06-20T09:00:00Z', updatedAt: '2026-06-22T11:00:00Z'
  },
  {
    id: 'issue-112',
    title: 'Garbage Mountain on JP Nagar Service Road',
    category: 'garbage',
    subType: 'uncleared_waste_heap',
    description: 'An enormous pile of mixed waste — including construction debris, household garbage, and e-waste — has accumulated on the JP Nagar 6th Phase service road. The pile is at least 6 feet high.',
    severity: 3,
    priorityScore: 62,
    status: 'acknowledged',
    location: { lat: 12.9050, lng: 77.5850, address: '6th Phase Service Road, JP Nagar', ward: 'Ward 178 - JP Nagar' },
    confirmations: 5, upvotes: 15, reportsCount: 2, reportIds: ['rep-31'],
    imageUrls: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Municipal Corporation (BBMP Solid Waste)',
    aiRationale: 'Large waste accumulation on service road. Health hazard from decomposing waste.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-21T08:00:00Z', note: 'Waste pile reported.', actor: 'Citizen' },
      { status: 'acknowledged', timestamp: '2026-06-22T10:00:00Z', note: 'BBMP notified for clearance.', actor: 'Municipal Admin' }
    ],
    createdAt: '2026-06-21T08:00:00Z', updatedAt: '2026-06-22T10:00:00Z'
  },
  {
    id: 'issue-113',
    title: 'Deep Pothole Swallowing Two-Wheelers',
    category: 'pothole',
    subType: 'road_crater',
    description: 'A deep pothole on Marathahalli Bridge approach road has caused multiple two-wheeler accidents. The crater is filled with rainwater hiding its true depth. Two injuries reported this week.',
    severity: 5,
    priorityScore: 93,
    status: 'in_progress',
    location: { lat: 12.9560, lng: 77.7010, address: 'Marathahalli Bridge Approach Road', ward: 'Ward 84 - Marathahalli' },
    confirmations: 11, upvotes: 42, reportsCount: 4, reportIds: ['rep-32', 'rep-33'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Public Works Department (PWD)',
    assignedOfficer: 'Officer Ramesh Kumar',
    eta: '2026-06-24',
    aiRationale: 'Injury-causing road hazard on high-traffic bridge approach. Emergency patching mandated.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-21T07:00:00Z', note: 'Multiple accident reports at same spot.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-21T07:30:00Z', note: 'Auto-verified.', actor: 'UrbanEye System' },
      { status: 'in_progress', timestamp: '2026-06-22T08:00:00Z', note: 'Emergency patching crew dispatched.', actor: 'Officer Ramesh Kumar' }
    ],
    createdAt: '2026-06-21T07:00:00Z', updatedAt: '2026-06-22T08:00:00Z'
  },
  {
    id: 'issue-114',
    title: 'Illegal Construction Debris Dumped on Footpath',
    category: 'illegal_dumping',
    subType: 'construction_debris',
    description: 'Construction debris including broken bricks, cement chunks, and metal rods have been dumped all along the pedestrian footpath near Yelahanka New Town bus terminus, forcing walkers onto the road.',
    severity: 3,
    priorityScore: 58,
    status: 'pending_verification',
    location: { lat: 13.1005, lng: 77.5960, address: 'Near Bus Terminus, Yelahanka New Town', ward: 'Ward 4 - Yelahanka' },
    confirmations: 2, upvotes: 8, reportsCount: 1, reportIds: ['rep-34'],
    imageUrls: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Municipal Corporation (BBMP Solid Waste)',
    aiRationale: 'Footpath obstruction from illegal dumping. Pedestrian safety concern.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-23T15:00:00Z', note: 'Debris dumping reported.', actor: 'Citizen' }
    ],
    createdAt: '2026-06-23T15:00:00Z', updatedAt: '2026-06-23T15:00:00Z'
  },
  {
    id: 'issue-115',
    title: 'Storm Drain Collapse Blocking Hebbal Road',
    category: 'drainage',
    subType: 'drain_structural_failure',
    description: 'The storm drain cover near Hebbal Flyover has collapsed, creating a dangerous open hole right on the roadway. Temporary barricades have been placed by locals but the hazard remains.',
    severity: 4,
    priorityScore: 84,
    status: 'acknowledged',
    location: { lat: 13.0358, lng: 77.5970, address: 'Near Hebbal Flyover, Bellary Road', ward: 'Ward 8 - Hebbal' },
    confirmations: 7, upvotes: 25, reportsCount: 3, reportIds: ['rep-35', 'rep-36'],
    imageUrls: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Stormwater Drain Division (SWD)',
    aiRationale: 'Open drain on major road. Vehicle fall-in risk. Structural reconstruction needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T11:00:00Z', note: 'Drain collapse reported.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-22T11:30:00Z', note: 'Verified.', actor: 'UrbanEye System' },
      { status: 'acknowledged', timestamp: '2026-06-22T16:00:00Z', note: 'SWD notified.', actor: 'Municipal Admin' }
    ],
    createdAt: '2026-06-22T11:00:00Z', updatedAt: '2026-06-22T16:00:00Z'
  },
  {
    id: 'issue-116',
    title: 'Flickering Street Lights on Ring Road Stretch',
    category: 'broken_streetlight',
    subType: 'intermittent_failure',
    description: 'Multiple street lights along Outer Ring Road near Sarjapur junction flicker on and off intermittently, causing visibility hazards for motorists at night.',
    severity: 3,
    priorityScore: 55,
    status: 'pending_verification',
    location: { lat: 12.9100, lng: 77.6850, address: 'ORR near Sarjapur Junction', ward: 'Ward 149 - Sarjapur' },
    confirmations: 3, upvotes: 10, reportsCount: 1, reportIds: ['rep-37'],
    imageUrls: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Electricity Supply Company (BESCOM)',
    aiRationale: 'Intermittent light failures suggest voltage fluctuation from the sub-station. BESCOM audit recommended.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-23T21:00:00Z', note: 'Reported at night.', actor: 'Citizen' }
    ],
    createdAt: '2026-06-23T21:00:00Z', updatedAt: '2026-06-23T21:00:00Z'
  },
  {
    id: 'issue-117',
    title: 'Water Logging at Silk Board Junction Underpass',
    category: 'drainage',
    subType: 'waterlogging_chronic',
    description: 'The underpass at Silk Board Junction is chronically waterlogged during any rainfall. Water level reaches up to 2 feet, stalling vehicles and causing engine damage to cars.',
    severity: 4,
    priorityScore: 80,
    status: 'verified',
    location: { lat: 12.9177, lng: 77.6230, address: 'Silk Board Junction Underpass', ward: 'Ward 175 - HSR Layout' },
    confirmations: 13, upvotes: 50, reportsCount: 5, reportIds: ['rep-38', 'rep-39', 'rep-40'],
    imageUrls: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Stormwater Drain Division (SWD)',
    aiRationale: 'Chronic waterlogging at critical junction. Pump installation and drain capacity expansion needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-20T16:00:00Z', note: 'Flooding during afternoon rain.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-20T16:30:00Z', note: 'Photo and video evidence verified.', actor: 'UrbanEye System' }
    ],
    createdAt: '2026-06-20T16:00:00Z', updatedAt: '2026-06-20T16:30:00Z'
  },
  {
    id: 'issue-118',
    title: 'Damaged Road Signage at Electronic City Flyover',
    category: 'damaged_signage',
    subType: 'traffic_sign_fallen',
    description: 'A large directional road sign at the Electronic City flyover exit has been knocked down, possibly by a heavy vehicle. It is lying on the road median causing confusion for incoming traffic.',
    severity: 3,
    priorityScore: 60,
    status: 'acknowledged',
    location: { lat: 12.8460, lng: 77.6600, address: 'Electronic City Flyover Exit', ward: 'Ward 198 - Electronic City' },
    confirmations: 4, upvotes: 12, reportsCount: 1, reportIds: ['rep-41'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Traffic Management Centre (TMC)',
    aiRationale: 'Fallen signage at flyover exit causing navigational confusion. TMC to restore.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T13:00:00Z', note: 'Sign fall reported.', actor: 'Citizen' },
      { status: 'acknowledged', timestamp: '2026-06-23T09:00:00Z', note: 'TMC notified.', actor: 'Municipal Admin' }
    ],
    createdAt: '2026-06-22T13:00:00Z', updatedAt: '2026-06-23T09:00:00Z'
  },
  {
    id: 'issue-119',
    title: 'Open Garbage Burning Near School',
    category: 'garbage',
    subType: 'waste_burning',
    description: 'Garbage is being burned openly near a government school in Basavanagudi, releasing toxic fumes. Children and teachers complain of breathing difficulties during morning assembly.',
    severity: 4,
    priorityScore: 85,
    status: 'verified',
    location: { lat: 12.9420, lng: 77.5750, address: 'Near Govt School, Basavanagudi', ward: 'Ward 160 - Basavanagudi' },
    confirmations: 9, upvotes: 32, reportsCount: 3, reportIds: ['rep-42', 'rep-43'],
    imageUrls: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Karnataka State Pollution Control Board (KSPCB)',
    aiRationale: 'Air quality hazard near educational institution. Open burning violates pollution norms. Immediate enforcement needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-21T07:30:00Z', note: 'Burning reported by school staff.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-21T08:00:00Z', note: 'Confirmed with photos showing active fire and smoke.', actor: 'UrbanEye System' }
    ],
    createdAt: '2026-06-21T07:30:00Z', updatedAt: '2026-06-21T08:00:00Z'
  },
  {
    id: 'issue-120',
    title: 'Pothole Cluster on Hosur Road',
    category: 'pothole',
    subType: 'multiple_potholes',
    description: 'A cluster of 6+ potholes within a 200-meter stretch of Hosur Road near Madiwala is causing extreme discomfort to commuters. Several two-wheeler riders have reported near-misses.',
    severity: 4,
    priorityScore: 78,
    status: 'in_progress',
    location: { lat: 12.9220, lng: 77.6200, address: 'Hosur Road near Madiwala', ward: 'Ward 177 - Madiwala' },
    confirmations: 6, upvotes: 20, reportsCount: 2, reportIds: ['rep-44'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Public Works Department (PWD)',
    assignedOfficer: 'Officer Ramesh Kumar',
    eta: '2026-06-26',
    aiRationale: 'Multiple potholes on NH suggest base-layer failure requiring resurfacing, not just patching.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-20T08:00:00Z', note: 'Pothole cluster reported.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-20T09:00:00Z', note: 'Verified.', actor: 'UrbanEye System' },
      { status: 'in_progress', timestamp: '2026-06-22T10:00:00Z', note: 'Road resurfacing equipment dispatched.', actor: 'Officer Ramesh Kumar' }
    ],
    createdAt: '2026-06-20T08:00:00Z', updatedAt: '2026-06-22T10:00:00Z'
  },
  {
    id: 'issue-121',
    title: 'Broken Water Meter Leaking Continuously',
    category: 'water_leak',
    subType: 'meter_malfunction',
    description: 'A BWSSB water meter on the main supply line at Sadashivanagar has cracked and water has been leaking continuously for over a week. Estimated wastage: 500+ liters/day.',
    severity: 3,
    priorityScore: 55,
    status: 'acknowledged',
    location: { lat: 12.9990, lng: 77.5800, address: 'Main Supply Line, Sadashivanagar', ward: 'Ward 52 - Sadashivanagar' },
    confirmations: 4, upvotes: 14, reportsCount: 1, reportIds: ['rep-45'],
    imageUrls: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Water Supply & Sewerage Board (BWSSB)',
    aiRationale: 'Continuous meter-level leak. Low severity but persistent wastage. Meter replacement needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T12:00:00Z', note: 'Meter leak reported.', actor: 'Citizen' },
      { status: 'acknowledged', timestamp: '2026-06-23T10:00:00Z', note: 'BWSSB meter replacement scheduled.', actor: 'Municipal Admin' }
    ],
    createdAt: '2026-06-22T12:00:00Z', updatedAt: '2026-06-23T10:00:00Z'
  },
  {
    id: 'issue-122',
    title: 'Dead Animal Carcass Dumped Near Market',
    category: 'illegal_dumping',
    subType: 'animal_carcass',
    description: 'A large animal carcass has been dumped near the KR Market entrance. The stench is overwhelming and is attracting vultures and stray dogs, posing a health and safety risk to market-goers.',
    severity: 4,
    priorityScore: 80,
    status: 'in_progress',
    location: { lat: 12.9650, lng: 77.5780, address: 'Near KR Market Entrance, City Market', ward: 'Ward 112 - City Market' },
    confirmations: 6, upvotes: 18, reportsCount: 2, reportIds: ['rep-46'],
    imageUrls: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Municipal Corporation (BBMP Solid Waste)',
    assignedOfficer: 'Inspector Srinivas G.',
    aiRationale: 'Biohazard near food market. Immediate carcass removal and sanitization required.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-23T06:00:00Z', note: 'Carcass found at dawn.', actor: 'Citizen' },
      { status: 'in_progress', timestamp: '2026-06-23T08:00:00Z', note: 'BBMP team dispatched for removal.', actor: 'Inspector Srinivas G.' }
    ],
    createdAt: '2026-06-23T06:00:00Z', updatedAt: '2026-06-23T08:00:00Z'
  },
  {
    id: 'issue-123',
    title: 'Exposed Manhole Without Cover on MG Road',
    category: 'drainage',
    subType: 'missing_manhole_cover',
    description: 'A manhole cover is missing on MG Road near Trinity Circle, leaving a deep open hole in the middle of the sidewalk. Multiple pedestrians have nearly fallen in, especially at night.',
    severity: 5,
    priorityScore: 95,
    status: 'verified',
    location: { lat: 12.9730, lng: 77.6020, address: 'MG Road near Trinity Circle', ward: 'Ward 94 - Shanthinagar' },
    confirmations: 11, upvotes: 40, reportsCount: 4, reportIds: ['rep-47', 'rep-48'],
    imageUrls: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Stormwater Drain Division (SWD)',
    aiRationale: 'Life-threatening open manhole on prime pedestrian corridor. Immediate cover replacement mandatory.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T19:00:00Z', note: 'Pedestrian nearly fell in at night.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-22T19:15:00Z', note: 'Emergency verified.', actor: 'UrbanEye System' }
    ],
    createdAt: '2026-06-22T19:00:00Z', updatedAt: '2026-06-22T19:15:00Z'
  },
  {
    id: 'issue-124',
    title: 'Unauthorized Hoardings Blocking Traffic View',
    category: 'damaged_signage',
    subType: 'illegal_hoarding',
    description: 'Multiple unauthorized advertising hoardings at the Vijayanagar junction are blocking the line of sight for vehicles turning from the service road onto the main road, creating a blind spot.',
    severity: 3,
    priorityScore: 52,
    status: 'pending_verification',
    location: { lat: 12.9710, lng: 77.5370, address: 'Vijayanagar Junction, Service Road', ward: 'Ward 108 - Vijayanagar' },
    confirmations: 2, upvotes: 7, reportsCount: 1, reportIds: ['rep-49'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Traffic Management Centre (TMC)',
    aiRationale: 'Illegal hoardings causing traffic blind spot. TMC to remove unauthorized signage.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-23T14:00:00Z', note: 'Reported by motorist.', actor: 'Citizen' }
    ],
    createdAt: '2026-06-23T14:00:00Z', updatedAt: '2026-06-23T14:00:00Z'
  },
  {
    id: 'issue-125',
    title: 'Broken Water Hydrant Spraying Water',
    category: 'water_leak',
    subType: 'hydrant_damage',
    description: 'A fire hydrant near the RT Nagar police station has been struck by a vehicle and is spraying water at high pressure. The geyser of water is flooding the entire intersection.',
    severity: 5,
    priorityScore: 91,
    status: 'in_progress',
    location: { lat: 13.0210, lng: 77.5920, address: 'Near Police Station, RT Nagar', ward: 'Ward 20 - RT Nagar' },
    confirmations: 8, upvotes: 30, reportsCount: 3, reportIds: ['rep-50', 'rep-51'],
    imageUrls: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Water Supply & Sewerage Board (BWSSB)',
    assignedOfficer: 'Engineer Vikram Hegde',
    eta: '2026-06-24',
    aiRationale: 'High-pressure hydrant breach flooding intersection. Emergency valve shutoff needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-23T16:00:00Z', note: 'Hydrant struck by truck.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-23T16:10:00Z', note: 'Emergency verified.', actor: 'UrbanEye System' },
      { status: 'in_progress', timestamp: '2026-06-23T17:00:00Z', note: 'BWSSB emergency crew en route.', actor: 'Engineer Vikram Hegde' }
    ],
    createdAt: '2026-06-23T16:00:00Z', updatedAt: '2026-06-23T17:00:00Z'
  },
  {
    id: 'issue-126',
    title: 'Overloaded Garbage Bin Overflowing for Days',
    category: 'garbage',
    subType: 'bin_overflow',
    description: 'The community garbage bin at Koramangala 5th Block has been overflowing for 5 days with no BBMP collection. Waste is spilling onto the pavement and the gutter. Rats and cockroaches seen.',
    severity: 3,
    priorityScore: 65,
    status: 'acknowledged',
    location: { lat: 12.9350, lng: 77.6200, address: '5th Block, Koramangala', ward: 'Ward 151 - Koramangala' },
    confirmations: 5, upvotes: 16, reportsCount: 2, reportIds: ['rep-52'],
    imageUrls: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Municipal Corporation (BBMP Solid Waste)',
    aiRationale: 'Missed waste collection for 5 days. Pest infestation risk. BBMP collection schedule review needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-18T09:00:00Z', note: 'Bin overflow reported.', actor: 'Citizen' },
      { status: 'acknowledged', timestamp: '2026-06-20T10:00:00Z', note: 'BBMP notified.', actor: 'Municipal Admin' }
    ],
    createdAt: '2026-06-18T09:00:00Z', updatedAt: '2026-06-20T10:00:00Z'
  },
  {
    id: 'issue-127',
    title: 'Electrical Post Leaning Dangerously',
    category: 'broken_streetlight',
    subType: 'pole_structural_failure',
    description: 'An old wooden electrical post on Bannerghatta Road near Arekere is leaning at a 30-degree angle and could topple at any time. The wires are under tension and could snap.',
    severity: 5,
    priorityScore: 94,
    status: 'verified',
    location: { lat: 12.8850, lng: 77.6050, address: 'Bannerghatta Road, Arekere', ward: 'Ward 192 - Arekere' },
    confirmations: 10, upvotes: 36, reportsCount: 3, reportIds: ['rep-53', 'rep-54'],
    imageUrls: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Electricity Supply Company (BESCOM)',
    aiRationale: 'Imminent pole collapse risk. High-tension wires could snap causing electrocution. Emergency replacement needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T06:00:00Z', note: 'Leaning pole spotted.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-22T06:30:00Z', note: 'Verified as critical structural failure.', actor: 'UrbanEye System' }
    ],
    createdAt: '2026-06-22T06:00:00Z', updatedAt: '2026-06-22T06:30:00Z'
  },
  {
    id: 'issue-128',
    title: 'Road Cave-in Near Namma Metro Construction',
    category: 'pothole',
    subType: 'construction_related_damage',
    description: 'A section of road near the Namma Metro Phase 2 construction site in Kanakapura Road has caved in, exposing underground pipes and creating a 3-foot deep hole.',
    severity: 4,
    priorityScore: 82,
    status: 'acknowledged',
    location: { lat: 12.8950, lng: 77.5750, address: 'Kanakapura Road, Near Metro Site', ward: 'Ward 188 - Uttarahalli' },
    confirmations: 6, upvotes: 22, reportsCount: 2, reportIds: ['rep-55'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Bangalore Metro Rail Corporation (BMRCL)',
    aiRationale: 'Metro construction-related road damage. BMRCL responsible for restoration.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-21T10:00:00Z', note: 'Road cave-in near metro site.', actor: 'Citizen' },
      { status: 'acknowledged', timestamp: '2026-06-22T09:00:00Z', note: 'BMRCL notified.', actor: 'Municipal Admin' }
    ],
    createdAt: '2026-06-21T10:00:00Z', updatedAt: '2026-06-22T09:00:00Z'
  },
  {
    id: 'issue-129',
    title: 'Sewage Contaminating Drinking Water Well',
    category: 'water_leak',
    subType: 'contamination_hazard',
    description: 'Residents in Hennur Main Road area suspect that a broken sewage line is contaminating the community borewell. Water has developed a yellowish tint and foul odor.',
    severity: 5,
    priorityScore: 97,
    status: 'verified',
    location: { lat: 13.0450, lng: 77.6350, address: 'Hennur Main Road, Near Community Well', ward: 'Ward 24 - Hennur' },
    confirmations: 12, upvotes: 48, reportsCount: 4, reportIds: ['rep-56', 'rep-57'],
    imageUrls: ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Water Supply & Sewerage Board (BWSSB)',
    aiRationale: 'Critical public health emergency. Suspected sewage-borewell cross-contamination. Water testing and sewage line repair urgent.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-21T05:00:00Z', note: 'Contaminated water reported.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-21T06:00:00Z', note: 'Water sample collected. Contamination confirmed.', actor: 'UrbanEye System' }
    ],
    createdAt: '2026-06-21T05:00:00Z', updatedAt: '2026-06-21T06:00:00Z'
  },
  {
    id: 'issue-130',
    title: 'Damaged Speed Breaker Causing Vehicle Damage',
    category: 'pothole',
    subType: 'speed_breaker_damage',
    description: 'A poorly constructed speed breaker on Cunningham Road has partially broken, leaving sharp exposed aggregate and rebar that is puncturing tires of passing vehicles.',
    severity: 3,
    priorityScore: 62,
    status: 'pending_verification',
    location: { lat: 12.9820, lng: 77.5920, address: 'Cunningham Road, Near Race Course', ward: 'Ward 89 - Shivajinagar' },
    confirmations: 3, upvotes: 11, reportsCount: 1, reportIds: ['rep-58'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Public Works Department (PWD)',
    aiRationale: 'Damaged speed breaker with exposed rebar. Tire-puncture hazard.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-23T18:00:00Z', note: 'Speed breaker damage reported.', actor: 'Citizen' }
    ],
    createdAt: '2026-06-23T18:00:00Z', updatedAt: '2026-06-23T18:00:00Z'
  },
  {
    id: 'issue-131',
    title: 'Massive Garbage Dump Behind Apartment Complex',
    category: 'illegal_dumping',
    subType: 'unauthorized_dump_site',
    description: 'A vacant plot behind an apartment complex on Sarjapur Road has become an unauthorized garbage dump. Construction debris, household waste, and plastic waste piled 8 feet high.',
    severity: 4,
    priorityScore: 75,
    status: 'acknowledged',
    location: { lat: 12.9100, lng: 77.6750, address: 'Sarjapur Road, Near Wipro Gate', ward: 'Ward 149 - Sarjapur' },
    confirmations: 7, upvotes: 23, reportsCount: 3, reportIds: ['rep-59', 'rep-60'],
    imageUrls: ['https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Municipal Corporation (BBMP Solid Waste)',
    aiRationale: 'Illegal dump site near residential complex. Health and environmental hazard. BBMP enforcement needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-19T10:00:00Z', note: 'Illegal dump reported.', actor: 'Citizen' },
      { status: 'acknowledged', timestamp: '2026-06-20T11:00:00Z', note: 'BBMP inspection scheduled.', actor: 'Municipal Admin' }
    ],
    createdAt: '2026-06-19T10:00:00Z', updatedAt: '2026-06-20T11:00:00Z'
  },
  {
    id: 'issue-132',
    title: 'Fallen Tree Blocking Entire Road',
    category: 'other',
    subType: 'tree_fall',
    description: 'A large banyan tree has fallen across the entire width of Bellary Road near Ganganagar during last night\'s storm, blocking all traffic. Power lines are trapped under the tree.',
    severity: 5,
    priorityScore: 90,
    status: 'in_progress',
    location: { lat: 13.0100, lng: 77.5880, address: 'Bellary Road, Near Ganganagar', ward: 'Ward 15 - Ganganagar' },
    confirmations: 9, upvotes: 33, reportsCount: 3, reportIds: ['rep-61', 'rep-62'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'BBMP Forestry Division',
    assignedOfficer: 'Supervisor Manjunath K.',
    eta: '2026-06-24',
    aiRationale: 'Total road blockage with power line entanglement. Joint operation needed: BBMP Forestry + BESCOM.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-23T04:00:00Z', note: 'Tree fall during storm.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-23T04:30:00Z', note: 'Emergency verified.', actor: 'UrbanEye System' },
      { status: 'in_progress', timestamp: '2026-06-23T06:00:00Z', note: 'Chainsaw crew and crane dispatched.', actor: 'Supervisor Manjunath K.' }
    ],
    createdAt: '2026-06-23T04:00:00Z', updatedAt: '2026-06-23T06:00:00Z'
  },
  {
    id: 'issue-133',
    title: 'Footpath Tiles Broken and Uneven',
    category: 'pothole',
    subType: 'footpath_damage',
    description: 'Pedestrian footpath tiles on Brigade Road are extensively broken and uneven, causing trip hazards. Several elderly pedestrians have fallen and sustained injuries.',
    severity: 3,
    priorityScore: 58,
    status: 'pending_verification',
    location: { lat: 12.9720, lng: 77.6080, address: 'Brigade Road, Central Bangalore', ward: 'Ward 94 - Shanthinagar' },
    confirmations: 3, upvotes: 9, reportsCount: 1, reportIds: ['rep-63'],
    imageUrls: ['https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Public Works Department (PWD)',
    aiRationale: 'Footpath hazard on major commercial street. Elderly injury reports warrant attention.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-23T12:00:00Z', note: 'Footpath damage reported.', actor: 'Citizen' }
    ],
    createdAt: '2026-06-23T12:00:00Z', updatedAt: '2026-06-23T12:00:00Z'
  },
  {
    id: 'issue-134',
    title: 'Stormwater Drain Overflow on Mysore Road',
    category: 'drainage',
    subType: 'drain_overflow',
    description: 'Heavy overnight rain has caused the stormwater drain on Mysore Road near Kengeri to overflow. The surrounding residential area is flooded with muddy drain water up to 1 foot.',
    severity: 4,
    priorityScore: 77,
    status: 'verified',
    location: { lat: 12.9150, lng: 77.4850, address: 'Mysore Road, Near Kengeri', ward: 'Ward 197 - Kengeri' },
    confirmations: 8, upvotes: 26, reportsCount: 3, reportIds: ['rep-64', 'rep-65'],
    imageUrls: ['https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Stormwater Drain Division (SWD)',
    aiRationale: 'Stormwater overflow in residential area. Drain capacity exceeded. Pump deployment needed.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T05:00:00Z', note: 'Flooding after overnight rain.', actor: 'Citizen' },
      { status: 'verified', timestamp: '2026-06-22T06:00:00Z', note: 'Multiple reports confirmed.', actor: 'UrbanEye System' }
    ],
    createdAt: '2026-06-22T05:00:00Z', updatedAt: '2026-06-22T06:00:00Z'
  },
  {
    id: 'issue-135',
    title: 'Hanging Cable Dangerously Low Over Road',
    category: 'broken_streetlight',
    subType: 'low_hanging_cable',
    description: 'A cable TV/internet cable has snapped and is hanging just 5 feet above the road on Old Airport Road near HAL. Trucks and buses are snagging it, risk of pulling down the utility pole.',
    severity: 4,
    priorityScore: 78,
    status: 'acknowledged',
    location: { lat: 12.9580, lng: 77.6650, address: 'Old Airport Road, Near HAL', ward: 'Ward 82 - HAL' },
    confirmations: 5, upvotes: 17, reportsCount: 2, reportIds: ['rep-66'],
    imageUrls: ['https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800'],
    assignedDepartment: 'Electricity Supply Company (BESCOM)',
    aiRationale: 'Low-hanging cable on busy road. Vehicle snagging risk and potential pole topple.',
    timeline: [
      { status: 'pending_verification', timestamp: '2026-06-22T14:00:00Z', note: 'Low cable reported.', actor: 'Citizen' },
      { status: 'acknowledged', timestamp: '2026-06-23T10:00:00Z', note: 'BESCOM notified.', actor: 'Municipal Admin' }
    ],
    createdAt: '2026-06-22T14:00:00Z', updatedAt: '2026-06-23T10:00:00Z'
  }
];

// Profile database definitions
const profiles: Record<string, UserProfile> = {
  'user-007': {
    id: 'user-007',
    name: 'Ananya Sharma',
    email: 'ananya.sharma@gmail.com',
    role: 'citizen',
    points: 420,
    streak: 5,
    reportsCount: 4,
    verificationsCount: 18,
    badges: [
      {
        id: 'badge-1',
        name: 'Civic Patrol',
        description: 'Reported your first valid neighborhood issue',
        icon: 'Eye',
        earnedAt: '2026-06-10T11:00:00Z'
      },
      {
        id: 'badge-2',
        name: 'Eagle Eye',
        description: 'Achieved 10+ correct community issue verifications',
        icon: 'Shield',
        earnedAt: '2026-06-18T15:30:00Z'
      },
      {
        id: 'badge-3',
        name: 'Green Guardian',
        description: 'Reported and helped resolve a major sanitation or waste dumping hazard',
        icon: 'Leaf',
        earnedAt: '2026-06-22T16:45:00Z'
      }
    ]
  },
  'admin-101': {
    id: 'admin-101',
    name: 'Officer Ramesh Kumar',
    email: 'ramesh.kumar@bbmp.gov.in',
    role: 'officer',
    department: 'Public Works Department (PWD)',
    points: 1500,
    streak: 12,
    reportsCount: 0,
    verificationsCount: 145,
    badges: [
      {
        id: 'badge-4',
        name: 'SLA Champion',
        description: 'Maintained >95% SLA clearance rate',
        icon: 'Award',
        earnedAt: '2026-05-12T10:00:00Z'
      }
    ]
  }
};

let activeProfileId = 'user-007';
let userProfile: UserProfile = { ...profiles['user-007'] };

// Predictive Insights
let insights: InsightCard[] = [
  {
    id: 'insight-1',
    title: 'Monsoon Flooding Risk Zone Detected',
    description: 'Based on historical analysis of clogged drain reports and precipitation charts, a major waterlogging risk is predicted near HSR Layout Sector 3 during the upcoming pre-monsoon showers.',
    type: 'warning',
    ward: 'Ward 174 - HSR Layout',
    category: 'drainage',
    frequency: 'Recurring (3 out of last 4 monsoons)',
    recommendation: 'Pre-emptive desiltation of storm channels along Outer Ring road and HSR Layout sectors 2 to 5 immediately.'
  },
  {
    id: 'insight-2',
    title: 'Systemic Lamp Failures on 12th Main',
    description: 'Frequent reports of damaged streetlights within a 150-meter radius indicates a possible underground wiring layout issue or a faulty sub-station breaker rather than singular bulb blowouts.',
    type: 'info',
    ward: 'Ward 151 - Koramangala',
    category: 'broken_streetlight',
    frequency: '4 reports in 30 days',
    recommendation: 'Request BESCOM electrical audit of the underground cabling panel at Koramangala 4th block.'
  },
  {
    id: 'insight-3',
    title: 'Successful Community Cleanup Initiative',
    description: 'Garbage pile reports in Ward 150 - Bellandur have decreased by 40% following swift BBMP fines and active community watch monitoring. Verified spots remain clean.',
    type: 'success',
    ward: 'Ward 150 - Bellandur',
    category: 'garbage',
    frequency: '40% improvement month-over-month',
    recommendation: 'Model this active monitoring and localized penalty scheme in adjacent high-density wards.'
  }
];

// ── Human-in-the-loop review pipeline ────────────────────────────────────────
// Citizen uploads land here first. The AI engine attaches insights
// (image authenticity detection + social-media corroboration). An officer
// approves (-> live map pin in both profiles) or discards.
interface ReviewInsights {
  imageDetection: { label: string; confidence: number }[];
  authenticity: { manipulated: boolean; score: number; verdict: string };
  socialMedia: { source: string; handle: string; snippet: string; matchConfidence: number; timeAgo: string }[];
  duplicateRisk: number;
  aiRecommendation: 'approve' | 'reject';
  aiSummary: string;
}

interface PendingReport {
  id: string;
  reporterName: string;
  submittedAt: string;
  insights: ReviewInsights;
  draftIssue: Issue; // staged; promoted to a live issue on approval
}

let pendingReports: PendingReport[] = [];
const reviewLog: {
  approved: { id: string; title: string; ward: string; decidedAt: string; officer: string }[];
  discarded: { id: string; title: string; ward: string; reason: string; decidedAt: string; officer: string }[];
} = { approved: [], discarded: [] };

const CATEGORY_LABELS: Record<string, string> = {
  pothole: 'Road surface damage', water_leak: 'Water / pipe leakage', broken_streetlight: 'Electrical / lighting fault',
  garbage: 'Solid waste accumulation', drainage: 'Drain blockage / overflow', illegal_dumping: 'Illegal dumping',
  damaged_signage: 'Damaged signage', other: 'General civic hazard',
};

// Fabricate AI-engine insights for an upload (deterministic, demo-grade)
function buildInsights(issue: Issue, hasRealImage: boolean): ReviewInsights {
  const area = issue.location.ward.split(' - ')[1] || issue.location.ward;
  const sev = issue.severity;
  const conf = Math.min(0.97, 0.6 + sev * 0.08);
  const secondary = sev >= 4 ? 'Standing water / debris' : 'Surface wear';

  const imageDetection = [
    { label: CATEGORY_LABELS[issue.category] || 'Civic hazard', confidence: Number(conf.toFixed(2)) },
    { label: secondary, confidence: Number((conf - 0.25).toFixed(2)) },
    { label: 'Public right-of-way', confidence: 0.71 },
  ];

  const manipScore = hasRealImage ? 0.05 + (issue.id.length % 5) * 0.01 : 0.12;
  const authenticity = {
    manipulated: manipScore > 0.5,
    score: Number(manipScore.toFixed(2)),
    verdict: manipScore > 0.5 ? 'Possible manipulation detected' : 'Likely authentic — no tampering signatures',
  };

  const socialMedia = [
    { source: 'Twitter / X', handle: `@${area.toLowerCase().replace(/\s+/g, '')}_res`, snippet: `Anyone else seeing this ${issue.category.replace('_', ' ')} near ${area}? Been days now.`, matchConfidence: Number((conf - 0.1).toFixed(2)), timeAgo: `${2 + (sev % 5)}h ago` },
    { source: 'Reddit r/bangalore', handle: 'u/namma_citizen', snippet: `${area} civic update: residents flagging the same ${issue.category.replace('_', ' ')} spot.`, matchConfidence: Number((conf - 0.22).toFixed(2)), timeAgo: '1d ago' },
  ];

  const duplicateRisk = Number((issue.reportsCount > 1 ? 0.7 : 0.15).toFixed(2));
  const recommend = !authenticity.manipulated && sev >= 3 && duplicateRisk < 0.6;

  return {
    imageDetection,
    authenticity,
    socialMedia,
    duplicateRisk,
    aiRecommendation: recommend ? 'approve' : 'reject',
    aiSummary: recommend
      ? `Image is ${Math.round(conf * 100)}% consistent with a ${issue.category.replace('_', ' ')}, corroborated by ${socialMedia.length} social posts from ${area}. Recommend approving and dispatching to ${issue.assignedDepartment}.`
      : `Low confidence or possible duplicate/tampering. Recommend manual rejection unless the officer can independently verify.`,
  };
}

// Seed synthetic uploads into the review queue so the AI Review console
// shows complete insights immediately (image detection + social scraping).
function makeDraftIssue(p: {
  id: string; title: string; category: IssueCategory; subType: string; description: string;
  severity: number; priorityScore: number; lat: number; lng: number; address: string; ward: string;
  department: string; image: string; reportsCount?: number; rationale: string; thoughts: string[];
}): Issue {
  const now = new Date().toISOString();
  return {
    id: p.id, title: p.title, category: p.category, subType: p.subType, description: p.description,
    severity: p.severity, priorityScore: p.priorityScore, status: 'pending_verification',
    location: { lat: p.lat, lng: p.lng, address: p.address, ward: p.ward },
    confirmations: 1, upvotes: 1, reportsCount: p.reportsCount || 1, reportIds: [`rep-${p.id}`],
    imageUrls: [p.image], assignedDepartment: p.department, aiRationale: p.rationale, aiThoughtProcess: p.thoughts,
    timeline: [{ status: 'pending_verification', timestamp: now, note: 'Citizen upload — AI engine attached insights, awaiting officer review.', actor: 'UrbanEye AI Agent' }],
    createdAt: now, updatedAt: now,
  };
}

const SEED_DRAFTS = [
  makeDraftIssue({
    id: 'pend-201', title: 'Deep pothole swallowing two-wheelers', category: 'pothole', subType: 'pothole_major',
    description: 'Wide, deep pothole on the main road near the metro pillar. Bikes are falling in during evening traffic.',
    severity: 4, priorityScore: 82, lat: 12.9352, lng: 77.6245, address: '17th Cross, near Metro Pillar 142, Koramangala', ward: 'Ward 151 - Koramangala',
    department: 'Public Works Department (PWD)', image: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800',
    rationale: 'Severe road damage on an arterial route with high two-wheeler traffic.', thoughts: ['Vision: road cavity detected', 'Cross-checked GPS to arterial road', 'Routed to PWD'],
  }),
  makeDraftIssue({
    id: 'pend-202', title: 'Burst water main flooding the street', category: 'water_leak', subType: 'pipe_burst',
    description: 'Drinking water pipeline burst, water shooting up and flooding the entire lane for the last 6 hours.',
    severity: 5, priorityScore: 91, lat: 12.9784, lng: 77.6408, address: '100 Feet Road service lane, Indiranagar', ward: 'Ward 80 - Indiranagar',
    department: 'Water Supply & Sewerage Board (BWSSB)', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800',
    rationale: 'Active potable-water loss and flooding; high urgency to arrest flow.', thoughts: ['Vision: high-volume water flow', 'Mapped to BWSSB mains', 'Severity raised to 5'],
  }),
  makeDraftIssue({
    id: 'pend-203', title: 'Possible garbage pile (low confidence)', category: 'garbage', subType: 'refuse_small',
    description: 'Looks like some bags near the wall, not sure if its today or old. Photo a bit blurry.',
    severity: 2, priorityScore: 38, lat: 12.9220, lng: 77.6780, address: 'Near park gate, Bellandur', ward: 'Ward 150 - Bellandur',
    department: 'Municipal Corporation (BBMP Solid Waste)', image: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800',
    rationale: 'Low-confidence sanitation report; image quality limits verification.', thoughts: ['Vision: ambiguous refuse signal', 'Low resolution flagged', 'Recommend manual check'],
  }),
];

SEED_DRAFTS.forEach((draft, i) => {
  pendingReports.push({
    id: draft.id,
    reporterName: ['Ananya Sharma', 'Rahul Verma', 'Priya N.'][i] || 'Citizen',
    submittedAt: new Date(Date.now() - (i + 1) * 1800000).toISOString(),
    insights: buildInsights(draft, true),
    draftIssue: draft,
  });
});

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log('Gemini API client successfully initialized.');
  } catch (error) {
    console.error('Failed to initialize Gemini Client:', error);
  }
} else {
  console.log('GEMINI_API_KEY is not defined. Using in-memory intelligent mock verification engine.');
}

// REST APIs
app.get('/api/issues', (req, res) => {
  res.json(issues);
});

app.get('/api/profile', (req, res) => {
  res.json(userProfile);
});

// Login as one of the pre-defined profiles
app.post('/api/profile/login', (req, res) => {
  const { profileId } = req.body;
  
  // Sync current memory state to profiles dictionary
  profiles[activeProfileId] = { ...userProfile };
  
  if (profiles[profileId]) {
    activeProfileId = profileId;
    userProfile = { ...profiles[profileId] };
    return res.json(userProfile);
  }
  res.status(400).json({ error: 'Invalid profile ID' });
});

app.get('/api/insights', (req, res) => {
  res.json(insights);
});

// Update role dynamically to test citizen/officer toggle
app.post('/api/profile/role', (req, res) => {
  const { role } = req.body;
  if (role === 'citizen' || role === 'officer') {
    userProfile.role = role;
    if (role === 'officer') {
      userProfile.department = 'Public Works Department (PWD)';
    } else {
      delete userProfile.department;
    }
    return res.json(userProfile);
  }
  res.status(400).json({ error: 'Invalid role' });
});

// Automated Verification & Categorization with Gemini API
app.post('/api/issues/report', async (req, res) => {
  const { title, description, category, address, ward, lat, lng, imageBase64, sampleImageId } = req.body;

  if (!description && !imageBase64 && !sampleImageId) {
    return res.status(400).json({ error: 'Description or Image is required' });
  }

  const generatedId = `issue-${Date.now()}`;
  const coordinates = {
    lat: lat || 12.9716,
    lng: lng || 77.5946
  };
  const finalWard = ward || 'Ward 80 - Indiranagar';
  const finalAddress = address || 'Indiranagar Main Road';

  let resolvedImage = imageBase64;
  if (!resolvedImage && sampleImageId) {
    // If user chose a sample issue preset, we can map it to high-res Unsplash links
    const samples: Record<string, string> = {
      pothole: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800',
      water_leak: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800',
      streetlight: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800',
      garbage: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800',
      drainage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=800'
    };
    resolvedImage = samples[sampleImageId] || samples.pothole;
  } else if (!resolvedImage) {
    resolvedImage = 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=800'; // Default pothole
  }

  // Deduplication check: Is there a similar category issue nearby?
  const isDuplicate = issues.some(existing => {
    if (existing.status !== 'resolved' && existing.category === category) {
      // rough distance calculation (~200m)
      const dLat = Math.abs(existing.location.lat - coordinates.lat);
      const dLng = Math.abs(existing.location.lng - coordinates.lng);
      return dLat < 0.002 && dLng < 0.002;
    }
    return false;
  });

  if (isDuplicate) {
    // Match found! Merge report with existing issue
    const existingIssue = issues.find(existing => existing.category === category && Math.abs(existing.location.lat - coordinates.lat) < 0.002);
    if (existingIssue) {
      existingIssue.reportsCount += 1;
      existingIssue.confirmations += 1;
      existingIssue.reportIds.push(`rep-${Date.now()}`);
      if (!existingIssue.imageUrls.includes(resolvedImage)) {
        existingIssue.imageUrls.push(resolvedImage);
      }
      existingIssue.upvotes += 5;
      existingIssue.priorityScore = Math.min(100, existingIssue.priorityScore + 4);
      existingIssue.timeline.push({
        status: existingIssue.status,
        timestamp: new Date().toISOString(),
        note: `Corroborating report merged from Citizen near ${finalAddress}. AI detected duplication and grouped the files.`,
        actor: 'UrbanEye AI Agent'
      });
      existingIssue.updatedAt = new Date().toISOString();

      // Award points
      userProfile.points += 20;
      userProfile.reportsCount += 1;

      return res.json({
        merged: true,
        issue: existingIssue,
        message: 'Duplicate report detected and merged automatically! Your report has been aggregated with an existing open issue to avoid department overhead. Points awarded!'
      });
    }
  }

  // Run real Gemini API analysis or smart fallback
  let aiVerdict = {
    category: (category || 'other') as IssueCategory,
    subType: 'road_damage_standard',
    severity: 3,
    priorityScore: 50,
    title: title || 'Reported Civic Issue',
    assignedDepartment: 'Public Works Department (PWD)',
    rationale: 'Issue successfully reported. Undergoing community verification.',
    thoughtProcess: [
      'Received report with descriptive text.',
      'Checking regional databases...',
      'Assigning to local Municipal Authority.'
    ],
    status: 'pending_verification' as IssueStatus
  };

  if (ai && process.env.GEMINI_API_KEY) {
    try {
      console.log('Calling Gemini API for intelligent civic triage...');
      
      const promptText = `
        You are "UrbanEye", the highly advanced Civic AI Triage Agent for municipal monitoring.
        Your task is to analyze a submitted civic issue report and provide structured analysis.
        
        Given:
        - Title: "${title || 'Not provided'}"
        - Description: "${description || 'Not provided'}"
        - Suggested Category: "${category || 'auto-detect'}"
        - Ward: "${finalWard}"
        - Address: "${finalAddress}"
        
        Analyze the issue and output standard JSON with the exact structure below. Be realistic. If the description suggests extreme hazard (like live hanging power cables, high flooded streets, deep craters on highway, heavy sewage flooding drinking water), raise the severity to 4 or 5 and set a high priority score (80-100). If it's simple litter or a small pothole on a narrow lane, set severity to 2 or 3 and score 40-60.
        
        Required JSON fields:
        {
          "title": "A short, professionally descriptive title of the issue",
          "category": "pothole" | "water_leak" | "broken_streetlight" | "garbage" | "drainage" | "illegal_dumping" | "damaged_signage" | "other",
          "subType": "snake_case_issue_specific_tag",
          "severity": <integer from 1 to 5>,
          "priorityScore": <integer from 10 to 100 representing urgency>,
          "assignedDepartment": "The actual municipal division, e.g. BBMP Solid Waste, BESCOM, BWSSB, PWD",
          "rationale": "One-sentence executive summary explaining the rating, threat assessment, and routing logic",
          "thoughtProcess": ["Point 1 of reasoning", "Point 2 of reasoning", "Point 3 of reasoning", "Point 4 of reasoning"],
          "status": "pending_verification" | "verified"
        }
        
        Rules:
        - Output ONLY valid JSON.
        - Do not surround with markdown blocks (no \`\`\`json etc.).
      `;

      let contents: any[] = [promptText];

      // If user provided base64 image, send it to Gemini
      if (imageBase64 && imageBase64.includes('base64,')) {
        const base64Data = imageBase64.split('base64,')[1];
        const mimeType = imageBase64.split(';')[0].split(':')[1];
        contents.unshift({
          inlineData: {
            mimeType,
            data: base64Data
          }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      });

      const responseText = response.text || '';
      console.log('Gemini Triage response:', responseText);
      const parsed = JSON.parse(responseText.trim());

      aiVerdict = {
        category: parsed.category || category || 'other',
        subType: parsed.subType || 'standard_hazard',
        severity: Number(parsed.severity) || 3,
        priorityScore: Number(parsed.priorityScore) || 50,
        title: parsed.title || title || 'Reported Issue',
        assignedDepartment: parsed.assignedDepartment || 'Local Municipality Board',
        rationale: parsed.rationale || 'Auto-categorized by AI.',
        thoughtProcess: parsed.thoughtProcess || ['Analyzed textual signals.', 'Mapped coordinates and region.'],
        status: parsed.status || 'pending_verification'
      };

    } catch (apiError) {
      console.error('Gemini API Triage error, using smart fallback:', apiError);
      // Smart local fallback based on keywords
      const descLower = (description + ' ' + (title || '')).toLowerCase();
      if (descLower.includes('wire') || descLower.includes('electric') || descLower.includes('spark') || descLower.includes('cable')) {
        aiVerdict.category = 'broken_streetlight';
        aiVerdict.subType = 'electrical_hazard';
        aiVerdict.severity = 5;
        aiVerdict.priorityScore = 95;
        aiVerdict.assignedDepartment = 'Electricity Supply Company (BESCOM)';
        aiVerdict.title = 'Live Exposed Wire / Electric Hazard';
        aiVerdict.rationale = 'Urgent life-threatening electrical threat flagged via local semantic keywords.';
        aiVerdict.thoughtProcess = [
          'Detected danger keyword matches: wire/electric/spark.',
          'Assigned extreme risk value 5 to secure direct safety dispatches.',
          'Bypassing queue parameters.'
        ];
      } else if (descLower.includes('water') || descLower.includes('leak') || descLower.includes('burst') || descLower.includes('pipe')) {
        aiVerdict.category = 'water_leak';
        aiVerdict.subType = 'pipe_leakage_major';
        aiVerdict.severity = 4;
        aiVerdict.priorityScore = 80;
        aiVerdict.assignedDepartment = 'Water Supply & Sewerage Board (BWSSB)';
        aiVerdict.title = 'Active Drinking Water Pipeline Leak';
        aiVerdict.rationale = 'Fresh water mains leakage detected. Auto-assigned to BWSSB for flow arrest.';
        aiVerdict.thoughtProcess = [
          'Keyword main leakage localized.',
          'Assigned to BWSSB.',
          'Determined severity 4 based on potential sidewalk erosion.'
        ];
      } else if (descLower.includes('dump') || descLower.includes('garbage') || descLower.includes('litter') || descLower.includes('trash') || descLower.includes('waste')) {
        aiVerdict.category = 'garbage';
        aiVerdict.subType = 'refuse_accumulation';
        aiVerdict.severity = 3;
        aiVerdict.priorityScore = 60;
        aiVerdict.assignedDepartment = 'Municipal Corporation (BBMP Solid Waste)';
        aiVerdict.title = 'Accumulated Garbage Pile / Littering';
        aiVerdict.rationale = 'Sanitation issue detected in neighborhood corridor. BBMP solid waste notified.';
        aiVerdict.thoughtProcess = [
          'Solid waste pattern confirmed.',
          'Mapped to municipal cleanup dispatch.'
        ];
      } else if (descLower.includes('pothole') || descLower.includes('crater') || descLower.includes('road') || descLower.includes('tarmac')) {
        aiVerdict.category = 'pothole';
        aiVerdict.subType = 'pothole_standard';
        aiVerdict.severity = 3;
        aiVerdict.priorityScore = 68;
        aiVerdict.assignedDepartment = 'Public Works Department (PWD)';
        aiVerdict.title = 'Hazardous Pothole on Street';
        aiVerdict.rationale = 'Road damage detected on local pavement. Routed to PWD to schedule patching.';
        aiVerdict.thoughtProcess = [
          'Pothole pattern recognized.',
          'Assigned to standard PWD repair schedules.'
        ];
      }
    }
  } else {
    // Basic Keyword Fallback when Gemini API is offline
    const descLower = (description + ' ' + (title || '')).toLowerCase();
    if (descLower.includes('wire') || descLower.includes('electric') || descLower.includes('spark') || descLower.includes('cable')) {
      aiVerdict.category = 'broken_streetlight';
      aiVerdict.subType = 'electrical_hazard';
      aiVerdict.severity = 5;
      aiVerdict.priorityScore = 95;
      aiVerdict.assignedDepartment = 'Electricity Supply Company (BESCOM)';
      aiVerdict.title = 'Live Exposed Wire / Electric Hazard';
      aiVerdict.rationale = 'Urgent electrical threat flagged by local semantic scanning.';
      aiVerdict.thoughtProcess = [
        'Exposed live cables spotted inside urban perimeter.',
        'Assigned highest priority to trigger immediate dispatcher dispatches.',
        'SLA deadline reduced to 12 hours.'
      ];
    } else if (descLower.includes('water') || descLower.includes('leak') || descLower.includes('burst') || descLower.includes('pipe')) {
      aiVerdict.category = 'water_leak';
      aiVerdict.subType = 'pipe_leakage_major';
      aiVerdict.severity = 4;
      aiVerdict.priorityScore = 82;
      aiVerdict.assignedDepartment = 'Water Supply & Sewerage Board (BWSSB)';
      aiVerdict.title = 'Water Mains Leakage / Pipe Burst';
      aiVerdict.rationale = 'High-volume water mains burst reported. BWSSB routed to prevent road washing.';
      aiVerdict.thoughtProcess = [
        'Main conduit leakage identified.',
        'Calculated threat matrix: water loss + local pooling.',
        'Routed to Water Engineering.'
      ];
    } else if (descLower.includes('dump') || descLower.includes('garbage') || descLower.includes('litter') || descLower.includes('trash') || descLower.includes('waste')) {
      aiVerdict.category = 'garbage';
      aiVerdict.subType = 'municipal_litter_pile';
      aiVerdict.severity = 3;
      aiVerdict.priorityScore = 55;
      aiVerdict.assignedDepartment = 'Municipal Corporation (BBMP Solid Waste)';
      aiVerdict.title = 'Garbage Pile & Littering';
      aiVerdict.rationale = 'Litter dump reported. Assigned to Solid Waste Management for routine collection.';
      aiVerdict.thoughtProcess = [
        'Sanitation report parsed.',
        'Routed to local waste management division.',
        'SLA window set to 48 hours.'
      ];
    }
  }

  // Generate canonical Issue
  const newIssue: Issue = {
    id: generatedId,
    title: aiVerdict.title,
    category: aiVerdict.category,
    subType: aiVerdict.subType,
    description: description || `Reported civic problem at ${finalAddress}`,
    severity: aiVerdict.severity,
    priorityScore: aiVerdict.priorityScore,
    status: aiVerdict.status,
    location: {
      lat: coordinates.lat,
      lng: coordinates.lng,
      address: finalAddress,
      ward: finalWard
    },
    confirmations: 1, // Author's report counts as first confirmation
    upvotes: 1,
    reportsCount: 1,
    reportIds: [`rep-${Date.now()}`],
    imageUrls: [resolvedImage],
    assignedDepartment: aiVerdict.assignedDepartment,
    aiRationale: aiVerdict.rationale,
    aiThoughtProcess: aiVerdict.thoughtProcess,
    timeline: [
      {
        status: 'pending_verification',
        timestamp: new Date().toISOString(),
        note: `Citizen submitted report. AI automatically analyzed image & description: Categorized as ${aiVerdict.category} (Severity ${aiVerdict.severity}/5), routed to ${aiVerdict.assignedDepartment}.`,
        actor: 'UrbanEye AI Agent'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Stage as a pending report for officer review (human-in-the-loop).
  // It does NOT appear as a live map pin until an officer approves it.
  const pending: PendingReport = {
    id: generatedId,
    reporterName: userProfile.name,
    submittedAt: new Date().toISOString(),
    insights: buildInsights(newIssue, Boolean(imageBase64 && imageBase64.includes('base64,'))),
    draftIssue: newIssue,
  };
  pendingReports.unshift(pending);

  // Update Citizen Points (earned for submitting a valid report)
  userProfile.points += 50;
  userProfile.reportsCount += 1;

  if (userProfile.reportsCount >= 1 && !userProfile.badges.some(b => b.id === 'badge-1')) {
    userProfile.badges.push({
      id: 'badge-1',
      name: 'Civic Patrol',
      description: 'Reported your first valid neighborhood issue',
      icon: 'Eye',
      earnedAt: new Date().toISOString()
    });
  }

  res.status(201).json({
    pending: true,
    review: pending,
    message: `Report received! The AI engine ran image-authenticity detection and social-media corroboration. It's now queued for officer review — you'll see it on the live map once approved. +50 points!`
  });
});

// ── Officer review endpoints ────────────────────────────────────────────────
app.get('/api/pending', (req, res) => {
  res.json(pendingReports);
});

app.get('/api/review-log', (req, res) => {
  res.json(reviewLog);
});

app.post('/api/pending/:id/decision', (req, res) => {
  const { id } = req.params;
  const { decision, reason, officer } = req.body as { decision: 'approve' | 'reject'; reason?: string; officer?: string };
  const idx = pendingReports.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Pending report not found' });

  const pending = pendingReports[idx];
  pendingReports.splice(idx, 1);
  const officerName = officer || userProfile.name || 'Officer';
  const now = new Date().toISOString();

  if (decision === 'approve') {
    const live = pending.draftIssue;
    live.timeline.push({
      status: live.status,
      timestamp: now,
      note: `Approved by ${officerName} after reviewing AI image-detection and social-media corroboration. Published to live map and routed to ${live.assignedDepartment}.`,
      actor: officerName,
    });
    live.updatedAt = now;
    issues.unshift(live); // live map pin — visible in both citizen + officer views
    reviewLog.approved.unshift({ id: live.id, title: live.title, ward: live.location.ward, decidedAt: now, officer: officerName });
    return res.json({ ok: true, decision, issue: live, pending: pendingReports, log: reviewLog });
  }

  // reject -> discarded
  reviewLog.discarded.unshift({
    id: pending.id,
    title: pending.draftIssue.title,
    ward: pending.draftIssue.location.ward,
    reason: reason || pending.insights.aiSummary,
    decidedAt: now,
    officer: officerName,
  });
  res.json({ ok: true, decision, pending: pendingReports, log: reviewLog });
});

// Upvote Issue
app.post('/api/issues/:id/upvote', (req, res) => {
  const { id } = req.params;
  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issue.upvotes += 1;
  issue.priorityScore = Math.min(100, issue.priorityScore + 1); // Upvotes slightly raise priority
  issue.updatedAt = new Date().toISOString();

  res.json(issue);
});

// Community Verification Workflow
app.post('/api/issues/:id/verify', (req, res) => {
  const { id } = req.params;
  const { confirmType } = req.body; // 'confirm' | 'fake'
  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  if (confirmType === 'confirm') {
    issue.confirmations += 1;
    userProfile.verificationsCount += 1;
    userProfile.points += 15; // 15 points per community verification

    // Check if verification threshold reached (3 confirmations)
    if (issue.confirmations >= 3 && issue.status === 'pending_verification') {
      issue.status = 'verified';
      issue.timeline.push({
        status: 'verified',
        timestamp: new Date().toISOString(),
        note: `Promoted to 'Verified' status following consensus from ${issue.confirmations} neighboring citizens. Automated notification dispatched to ${issue.assignedDepartment}.`,
        actor: 'UrbanEye System'
      });
    } else {
      issue.timeline.push({
        status: issue.status,
        timestamp: new Date().toISOString(),
        note: `Citizen verified the presence of this issue. (Consensus: ${issue.confirmations}/3 confirmations)`,
        actor: 'Citizen Community'
      });
    }

    // Award eagle eye badge
    if (userProfile.verificationsCount >= 10 && !userProfile.badges.some(b => b.id === 'badge-2')) {
      userProfile.badges.push({
        id: 'badge-2',
        name: 'Eagle Eye',
        description: 'Achieved 10+ correct community issue verifications',
        icon: 'Shield',
        earnedAt: new Date().toISOString()
      });
    }
  } else if (confirmType === 'fake') {
    // Flag as potential fake
    issue.timeline.push({
      status: issue.status,
      timestamp: new Date().toISOString(),
      note: 'Citizen disputed the validity of this issue. Flagged for priority audit.',
      actor: 'Citizen Community'
    });
    issue.priorityScore = Math.max(0, issue.priorityScore - 15); // Disputing lowers score
  }

  issue.updatedAt = new Date().toISOString();
  res.json({ issue, profile: userProfile });
});

// Officer Triage & Repair Resolution Workflow
app.post('/api/issues/:id/action', (req, res) => {
  const { id } = req.params;
  const { actionType, officerName, eta, resolvedNote, resolvedImageUrl } = req.body;
  const issue = issues.find(i => i.id === id);
  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  issue.updatedAt = new Date().toISOString();

  if (actionType === 'acknowledge') {
    issue.status = 'acknowledged';
    issue.assignedOfficer = officerName || 'Officer Jagdish Prasad';
    issue.eta = eta || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +3 days
    issue.timeline.push({
      status: 'acknowledged',
      timestamp: new Date().toISOString(),
      note: `Officer ${issue.assignedOfficer} acknowledged issue. Work order dispatched. Target ETA: ${issue.eta}.`,
      actor: issue.assignedOfficer
    });
  } else if (actionType === 'start_work') {
    issue.status = 'in_progress';
    issue.timeline.push({
      status: 'in_progress',
      timestamp: new Date().toISOString(),
      note: `Physical repair work started on site. Crews are actively addressing the hazard.`,
      actor: issue.assignedOfficer || 'Municipal Maintenance Crew'
    });
  } else if (actionType === 'resolve') {
    issue.status = 'resolved';
    issue.resolvedImageUrl = resolvedImageUrl || 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&q=80&w=800'; // Default after clean
    issue.resolvedNote = resolvedNote || 'Physical repairs completed successfully. Clean-up crews cleared all lingering debris and restored normal traffic operations. Quality inspection passed.';
    issue.timeline.push({
      status: 'resolved',
      timestamp: new Date().toISOString(),
      note: `Repair completed successfully! Resolving Notes: ${issue.resolvedNote}`,
      actor: issue.assignedOfficer || 'Municipal Maintenance Crew'
    });

    // If citizen who reported this gets it resolved, increment metrics
    userProfile.points += 100; // Large points on successful resolution of reported items
  } else if (actionType === 'reject') {
    issue.status = 'rejected';
    issue.timeline.push({
      status: 'rejected',
      timestamp: new Date().toISOString(),
      note: `Issue marked as rejected or spam after site inspection: ${resolvedNote || 'Inaccurate coordinates / Not a public infrastructure issue.'}`,
      actor: officerName || 'Quality Control Officer'
    });
  }

  res.json(issue);
});

// Dynamic AI Diagnostic & Predictive Analysis
app.post('/api/diagnostics', async (req, res) => {
  if (ai && process.env.GEMINI_API_KEY) {
    try {
      console.log('Running Deep Predictive Analysis with Gemini...');
      const datasetSummary = issues.map(i => ({
        id: i.id,
        category: i.category,
        subType: i.subType,
        ward: i.location.ward,
        severity: i.severity,
        status: i.status,
        createdAt: i.createdAt
      }));

      const prompt = `
        You are "UrbanEye Insights", an advanced urban planning AI agent.
        Analyze the following active issues dataset from a municipality and generate exactly 3 highly actionable predictive insight cards.
        Look for spatial patterns (multiple issues in the same ward), recurring hazards, or systemic risks.
        
        Dataset: ${JSON.stringify(datasetSummary)}
        
        Generate exactly 3 JSON insight cards. Output ONLY a valid JSON array of objects fitting the exact schema:
        [
          {
            "id": "insight-unique-id",
            "title": "Short title describing the insight",
            "description": "Thorough analysis of the pattern, including specific ward and category correlation",
            "type": "warning" | "info" | "success",
            "ward": "The affected Ward name",
            "category": "The primary issue category involved",
            "frequency": "Metric or recurrence statement",
            "recommendation": "Detailed preventative recommendation for city planning officials"
          }
        ]
        
        Rules:
        - Output ONLY valid JSON array. Do not include markdown \`\`\`json.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const text = response.text || '';
      console.log('AI Diagnostics completed.');
      const parsed = JSON.parse(text.trim());
      if (Array.isArray(parsed)) {
        insights = parsed;
      }
    } catch (err) {
      console.error('Failed to run AI diagnostics. Falling back to existing predictions.', err);
    }
  } else {
    console.log('Gemini offline. Resetting insights to standard pre-calculated models.');
  }
  res.json(insights);
});

// Conversational AI Assistant
app.post('/api/assistant', async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemInstructions = `
    You are the "UrbanEye AI Civic Assistant". Your job is to help citizens report, track, and understand civic issues in their community.
    You have real-time access to the current active database of reported issues.
    
    Active Database Summary:
    ${JSON.stringify(issues.map(i => ({
      id: i.id,
      title: i.title,
      category: i.category,
      status: i.status,
      ward: i.location.ward,
      address: i.location.address,
      severity: i.severity,
      priorityScore: i.priorityScore,
      confirmations: i.confirmations
    })))}
    
    Rules for response:
    1. Be incredibly friendly, supportive, and informative. Encourage civic action and citizen participation.
    2. If a user asks about the status of a specific issue, scan the database above and provide direct information about its current lifecycle phase, assigned department, and timeline.
    3. If they ask about general things (e.g., how to verify an issue, what departments handle streetlights), explain clearly.
    4. Speak simply and directly. Use elegant formatting. Keep it concise.
  `;

  if (ai && process.env.GEMINI_API_KEY) {
    try {
      console.log('Calling Gemini for AI Civic Chat...');
      
      const contents = (chatHistory || []).map((msg: any) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
      contents.push({ role: 'user', parts: [{ text: message }] });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents,
        config: {
          systemInstruction: systemInstructions,
          temperature: 0.7
        }
      });

      return res.json({ text: response.text });
    } catch (chatErr) {
      console.error('Gemini chat error, using mock chatbot:', chatErr);
    }
  }

  // Resilient Mock Chat Response
  const msgLower = message.toLowerCase();
  let text = "I am here to support you! How can I help with your community reports today?";
  if (msgLower.includes('pothole') || msgLower.includes('crater')) {
    const potholes = issues.filter(i => i.category === 'pothole');
    text = `We currently have **${potholes.length} active pothole reports** logged on our live map. The highest priority is **"${potholes[0]?.title}"** in **${potholes[0]?.location.ward}**, currently marked as **${potholes[0]?.status}**. 
    
    If you see a pothole in your street, you can report it via our **"Report Hazard"** portal with a photo! The system will automatically use GPS and auto-categorize it via computer vision.`;
  } else if (msgLower.includes('status') || msgLower.includes('track')) {
    text = `You can easily track all reported civic issues! Our database currently monitors several active cases. For example:
    - **${issues[1]?.title}** is currently **${issues[1]?.status}** by the **${issues[1]?.assignedDepartment}**.
    - **${issues[2]?.title}** is currently **${issues[2]?.status}** by **BESCOM**.
    
    Check your citizen profile in the **Profile** tab to view your personal reporting history and points.`;
  } else if (msgLower.includes('points') || msgLower.includes('badge') || msgLower.includes('gamif')) {
    text = `UrbanEye rewards active community participation! Here is how you earn points:
    - **Report a new unique issue**: +50 points
    - **Upvote or confirm a neighbors issue**: +15 points
    - **Contribute to a verified resolution**: +100 points
    
    Accumulate points to unlock badges like **Eagle Eye** and rank up the civic leadership dashboard!`;
  } else {
    text = `I'm the **UrbanEye Civic Assistant**! I can tell you about our **${issues.length} active municipal cases**, explain how automated triage works, or help you understand how to earn citizen points. 

    What local issue can I assist you with today?`;
  }

  res.json({ text });
});


// Dev Server & Production serving configurations
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Dev server running with Vite Middleware integration.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production server running, serving static files.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UrbanEye server launched successfully at http://localhost:${PORT}`);
  });
}

startServer();
