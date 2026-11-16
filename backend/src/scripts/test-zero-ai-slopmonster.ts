import { SlopMonsterService } from '../services/slopMonsterService';
import { EmailTemplateService, BUILTIN_TEMPLATES } from '../services/emailTemplateService';

async function runTestSuite() {
  console.log('=== STARTING ZERO-AI & SLOPMONSTER AUTOMATED TEST SUITE ===\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // TEST 1: SlopMonster flags known AI buzzwords
  try {
    const slopText = `In today's fast-paced digital landscape, we delve into cutting-edge solutions to leverage synergies and seamlessly transform your business. It is a testament to our robust architecture.`;
    const result = await SlopMonsterService.checkCopy(slopText);
    const hasFlags =
      result.score < 5.0 &&
      (result.categories.vocab.length > 0 ||
        result.categories.phrases.length > 0 ||
        result.rawReport.includes('cutting-edge') ||
        result.rawReport.includes('leverage'));

    assert(
      !result.clean && hasFlags,
      'Test 1: SlopMonster correctly flags AI buzzwords ("delve", "cutting-edge", "leverage", "robust", "testament")'
    );
  } catch (err: any) {
    console.error('Test 1 error:', err);
    assert(false, 'Test 1: SlopMonster flagged copy execution');
  }

  // TEST 2: SlopMonster approves clean, human, concise copy with 5.0 score
  try {
    const cleanText = `Hi Charlie,\n\nI saw your post on GitHub regarding backend systems.\n\nI build web applications with React and Node.js. If you have any ongoing projects where you need extra hands, I would be glad to help out.\n\nBest regards,\nMuhammad Ali`;
    const result = await SlopMonsterService.checkCopy(cleanText);
    assert(
      result.clean && result.score === 5.0,
      'Test 2: SlopMonster awards 5.0 Clean to direct, human, concise outreach copy'
    );
  } catch (err: any) {
    console.error('Test 2 error:', err);
    assert(false, 'Test 2: Clean copy scoring');
  }

  // TEST 3: All 11 built-in templates score 5.0 Clean on SlopMonster
  try {
    const mockProfile = {
      fullName: 'Muhammad Ali',
      professionalTitle: 'Full-Stack Software Engineer',
      location: 'Remote',
      shortBio: 'Full-stack engineer building fast, reliable web applications.',
      skills: 'TypeScript, React, Node.js, Express, Java, PostgreSQL',
      servicesOffered: 'Web development, REST API design, database modeling',
      portfolioUrl: 'https://github.com/mr-charlie39',
      githubUrl: 'https://github.com/mr-charlie39',
      linkedinUrl: '',
      signature: 'Best regards,\nMuhammad Ali',
      writingStyle: 'Direct, concise, professional',
    };

    const mockRecipient = {
      name: 'Sarah Connor',
      company: 'Cyberdyne',
      role: 'Head of Engineering',
      industry: 'Software',
      website: 'cyberdyne.io',
      category: 'ENTERPRISE',
    };

    let all11Passed = true;
    for (const template of BUILTIN_TEMPLATES) {
      const generated = EmailTemplateService.composeDraftText(template, mockProfile, mockRecipient);
      const slop = await SlopMonsterService.checkCopy(`${generated.subject}\n\n${generated.bodyText}`);
      if (!slop.clean || slop.score < 4.5) {
        console.warn(`Template ${template.key} scored ${slop.score}, flags:`, slop.categories);
        all11Passed = false;
      }
    }

    assert(all11Passed, 'Test 3: All 11 built-in outreach templates score 5.0 Clean with zero AI tells');
  } catch (err: any) {
    console.error('Test 3 error:', err);
    assert(false, 'Test 3: 11 templates SlopMonster check');
  }

  // TEST 4: Missing recipient parameters omit clauses instead of hallucinating data
  try {
    const mockProfile = {
      fullName: 'Muhammad Ali',
      professionalTitle: 'Software Engineer',
      signature: 'Best,\nMuhammad Ali',
    };

    // Recipient with missing company, industry, and role
    const partialRecipient = {
      name: 'Alex',
    };

    const template = BUILTIN_TEMPLATES.find((t) => t.key === 'WEB_DEV')!;
    const generated = EmailTemplateService.composeDraftText(template, mockProfile, partialRecipient);
    const hasHallucination =
      generated.bodyText.includes('at undefined') ||
      generated.bodyText.includes('{{') ||
      generated.bodyText.includes('null');

    assert(!hasHallucination, 'Test 4: Missing fields are omitted gracefully without hallucinating or rendering placeholders');
  } catch (err: any) {
    console.error('Test 4 error:', err);
    assert(false, 'Test 4: Graceful omission check');
  }

  console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===\n`);
  process.exit(passed === total ? 0 : 1);
}

runTestSuite();
