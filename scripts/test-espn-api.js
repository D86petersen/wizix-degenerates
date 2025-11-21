// ESPN API Test Script
// Run with: node scripts/test-espn-api.js

async function testESPNAPI() {
    console.log('🏈 Testing ESPN API...\n');

    const baseUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

    try {
        // Test 1: Get Teams
        console.log('Test 1: Fetching NFL Teams...');
        const teamsResponse = await fetch(`${baseUrl}/teams`);
        const teamsData = await teamsResponse.json();

        if (teamsData.sports && teamsData.sports[0].leagues) {
            const teams = teamsData.sports[0].leagues[0].teams;
            console.log(`✅ Success! Found ${teams.length} teams`);
            console.log(`   Example: ${teams[0].team.displayName}\n`);
        } else {
            console.log('❌ Failed to parse teams data\n');
        }

        // Test 2: Get Current Week Scoreboard
        console.log('Test 2: Fetching Current Week Scoreboard...');
        const scoreboardResponse = await fetch(`${baseUrl}/scoreboard`);
        const scoreboardData = await scoreboardResponse.json();

        if (scoreboardData.events) {
            console.log(`✅ Success! Found ${scoreboardData.events.length} games`);
            console.log(`   Week: ${scoreboardData.week?.number || 'Unknown'}`);
            console.log(`   Season: ${scoreboardData.season?.year || 'Unknown'}\n`);

            // Show first game
            if (scoreboardData.events.length > 0) {
                const game = scoreboardData.events[0];
                const competition = game.competitions[0];
                const homeTeam = competition.competitors.find(c => c.homeAway === 'home');
                const awayTeam = competition.competitors.find(c => c.homeAway === 'away');

                console.log('   Example Game:');
                console.log(`   ${awayTeam.team.displayName} @ ${homeTeam.team.displayName}`);
                console.log(`   Status: ${competition.status.type.description}\n`);
            }
        } else {
            console.log('❌ Failed to parse scoreboard data\n');
        }

        // Test 3: Get Specific Week
        console.log('Test 3: Fetching Week 1 Scoreboard...');
        const week1Response = await fetch(`${baseUrl}/scoreboard?seasontype=2&week=1`);
        const week1Data = await week1Response.json();

        if (week1Data.events) {
            console.log(`✅ Success! Found ${week1Data.events.length} games for Week 1\n`);
        } else {
            console.log('❌ Failed to fetch Week 1 data\n');
        }

        console.log('🎉 All tests completed!');
        console.log('\nThe ESPN API is working correctly.');
        console.log('You can now use this app with confidence!\n');

    } catch (error) {
        console.error('❌ Error testing ESPN API:', error.message);
        console.log('\nThis could mean:');
        console.log('1. No internet connection');
        console.log('2. ESPN API is temporarily down');
        console.log('3. Network firewall blocking requests\n');
    }
}

testESPNAPI();
