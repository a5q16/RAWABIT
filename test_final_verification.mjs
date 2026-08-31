import { getProfilesByWilaya, searchGlobalProfiles } from './js/data/profiles-data.js';

console.log('=== TEST: Dynamic Profiles & Skills ===');
const profiles = await getProfilesByWilaya(10);
profiles.slice(0, 2).forEach(p => {
  console.log(`\nExpert: ${p.name} (${p.nameAr})`);
  console.log('Tier:', p.tier, '| Wilaya:', p.wilayaCode);
  console.log('Skills:', p.skills);
  console.log('Academic:', p.academic);
  console.log('Professional:', p.professional);
  console.log('Sources:', p.sources.map(s => s.source_type + ': ' + s.source_url));
});
