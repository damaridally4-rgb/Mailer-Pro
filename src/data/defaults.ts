import { EmailTemplate, BatchConfig } from '../types';

export const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl-product-launch',
    name: 'Product Update & Feature Announcement',
    description: 'Share major product enhancements and invite key contacts to early access.',
    category: 'announcement',
    subject: 'Exclusive preview for {{Company}}: Accelerate your email workflows',
    body: `<p>Hi {{FirstName|there}},</p>
<p>I hope your week is off to a great start at <strong>{{Company|your organization}}</strong>.</p>
<p>We've just rolled out our next-generation batch delivery engine, designed specifically to help high-growth teams dispatch personalized communications without landing in spam traps.</p>
<p>Given your focus as {{Role|a key leader}}, here are three things that might interest you:</p>
<ul>
  <li><strong>Intelligent Pacing:</strong> Adaptive batch delays between dispatches to preserve domain reputation.</li>
  <li><strong>Deep Personalization:</strong> Dynamic fallback tags like {{FirstName}} and custom metadata injection.</li>
  <li><strong>Real-time Audit Logs:</strong> Instant visibility into delivery acknowledgments and failure retries.</li>
</ul>
<p>Would you have 10 minutes this Thursday or Friday for a quick 1-on-1 walkthrough?</p>
<p>Best regards,<br>
<strong>Alex Morgan</strong><br>
Operations Lead</p>`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-cold-outreach',
    name: 'Personalized Executive Outreach',
    description: 'Concise B2B inquiry tailored to role, company, and location.',
    category: 'outreach',
    subject: 'Quick question regarding {{Company}}\'s email architecture',
    body: `<p>Hi {{FirstName|there}},</p>
<p>I noticed your recent expansion at <strong>{{Company}}</strong> in {{City|your region}}—congratulations on the steady momentum!</p>
<p>As {{Role|a team leader}}, you're likely managing increasingly high volumes of customer touchpoints. Many teams experience inbox throttling or inconsistent delivery rates once campaigns cross the 500-contact threshold.</p>
<p>We built a streamlined client-side batching protocol that splits large cohorts into timed tranches with custom delay intervals and automatic retry queues.</p>
<p>Happy to send over a 2-minute overview or compare notes if this is on your roadmap this quarter.</p>
<p>Cheers,<br>
<strong>Jordan Lee</strong><br>
Partner Solutions</p>`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-event-invitation',
    name: 'VIP Private Session & Dinner Invitation',
    description: 'Exclusive invitation for conference attendees with registration details.',
    category: 'event',
    subject: 'VIP Invitation for {{FirstName}}: Executive roundtable in {{City}}',
    body: `<p>Dear {{FirstName|Colleague}},</p>
<p>We are delighted to extend a private invitation to you and select colleagues from <strong>{{Company}}</strong> to join our upcoming Executive Breakfast & Roundtable.</p>
<p><strong>Event:</strong> Modern Delivery & Infrastructure Summit<br>
<strong>Location:</strong> {{City|Downtown Executive Center}}<br>
<strong>Your Personal Access Pass:</strong> <code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: bold;">{{DiscountCode|VIP-ACCESS}}</code></p>
<p>We have reserved a limited number of seats for {{Role}} peers to discuss deliverability benchmarks, recipient engagement, and domain authentication strategies.</p>
<p>Please review the attached session outline for the complete agenda and speaker lineup. Simply reply to this email to lock in your reservation.</p>
<p>Warm regards,<br>
<strong>The Executive Host Committee</strong></p>`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tpl-feedback-followup',
    name: 'Customer Check-in & Review Request',
    description: 'Warm check-in for active accounts asking for feedback and guidance.',
    category: 'outreach',
    subject: 'Checking in on {{Company}}\'s experience',
    body: `<p>Hello {{FirstName|friend}},</p>
<p>I'm checking in from the support desk to see how everything has been performing for you and the team at <strong>{{Company}}</strong>.</p>
<p>We want to ensure your daily workflows as {{Role|an active user}} are seamless and lightning-fast. Do you have any feedback or feature requests you'd like our engineering team to prioritize?</p>
<p>If there is anything we can do to make your day-to-day simpler, just reply directly to this note. Every response goes straight to my personal inbox.</p>
<p>Thank you for being with us,<br>
<strong>Taylor Reed</strong><br>
Customer Success</p>`,
    updatedAt: new Date().toISOString(),
  },
];

export const SAMPLE_DATASETS = [
  {
    id: 'tech-summit',
    name: 'Tech Summit Attendees (8 contacts)',
    description: 'Conferences attendees with FirstName, LastName, Company, Role, and City',
    csv: `email,FirstName,LastName,Company,Role,City,DiscountCode
elena.rostova@nexus-tech.io,Elena,Rostova,Nexus Innovations,VP of Engineering,San Francisco,SUMMIT-VIP-01
marcus.vance@solaris-labs.com,Marcus,Vance,Solaris Labs,Lead Architect,Seattle,SUMMIT-VIP-02
sarah.chen@acme-systems.org,Sarah,Chen,Acme Systems,Head of Growth,New York,SUMMIT-VIP-03
david.kim@hyperflow.dev,David,Kim,Hyperflow Dynamics,Product Director,Austin,SUMMIT-VIP-04
priya.patel@vanguard-fin.com,Priya,Patel,Vanguard Financial,DevOps Lead,Boston,SUMMIT-VIP-05
lucas.silva@horizon-cloud.io,Lucas,Silva,Horizon Cloud,Infrastructure Architect,Chicago,SUMMIT-VIP-06
chloe.dubois@quantico-data.com,Chloe,Dubois,Quantico Analytics,Chief Data Officer,Denver,SUMMIT-VIP-07
samuel.green@strata-sec.net,Samuel,Green,Strata Security,Security Director,Atlanta,SUMMIT-VIP-08`,
  },
  {
    id: 'b2b-prospects',
    name: 'B2B Enterprise Cohort (5 contacts)',
    description: 'High-touch prospects with custom fields for targeted cold outreach',
    csv: `email,FirstName,LastName,Company,Role,City,DiscountCode
amara.okafor@zenith-logistics.com,Amara,Okafor,Zenith Global,VP Supply Chain,London,ZEN-PARTNER
daniel.meier@bavaria-eng.de,Daniel,Meier,Bavaria Industrial,Operations Manager,Munich,BAV-PARTNER
aiko.tanaka@neo-tokyo-ai.jp,Aiko,Tanaka,Neo Tokyo AI,Principal AI Engineer,Tokyo,NEO-PARTNER
mateo.morales@valencia-agri.es,Mateo,Morales,Valencia Systems,Technical Director,Madrid,VAL-PARTNER
jessica.wong@singapore-fin.sg,Jessica,Wong,Lion City Ventures,Managing Partner,Singapore,SG-PARTNER`,
  },
];

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  senderName: 'Alex Morgan',
  senderEmail: 'alex.morgan@company.com',
  replyTo: 'alex.morgan@company.com',
  batchSize: 3,
  delaySeconds: 2,
  failureSimulationRate: 0,
  sendMode: 'sandbox',
  customRelayUrl: '',
};
