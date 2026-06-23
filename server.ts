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
  }
];

// Profile data
let userProfile: UserProfile = {
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
};

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

  issues.unshift(newIssue);

  // Update Citizen Points
  userProfile.points += 50; // 50 points for a unique report
  userProfile.reportsCount += 1;
  
  // Award badge if not already awarded
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
    merged: false,
    issue: newIssue,
    message: `Issue reported successfully! Our UrbanEye AI Agent analyzed the submission, categorized it, and assigned it to the ${aiVerdict.assignedDepartment} with a severity of ${aiVerdict.severity}/5. You earned 50 points!`
  });
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
