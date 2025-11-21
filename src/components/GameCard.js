// Game Card Component
import { formatTime, hasGameStarted } from '../utils/date.js';

export function GameCard(game, userPick = null, onSelect = null, locked = false) {
    const isLocked = locked || hasGameStarted(game.date);
    const isLive = game.status.inProgress;
    const isCompleted = game.status.completed;

    const homeSelected = userPick?.picked_team_id === game.homeTeam.id;
    const awaySelected = userPick?.picked_team_id === game.awayTeam.id;

    return `
    <div class="game-card ${isLocked ? 'locked' : ''}" data-game-id="${game.id}">
      <div class="game-header">
        <div class="game-time">
          ${isLive ? '<span class="badge badge-live">LIVE</span>' : ''}
          ${isCompleted ? '<span class="badge badge-win">FINAL</span>' : ''}
          ${!isLive && !isCompleted ? formatTime(game.date) : ''}
        </div>
        ${isLocked ? '<span class="badge badge-pending">LOCKED</span>' : ''}
      </div>
      
      <div class="game-teams">
        <div class="team ${awaySelected ? 'selected' : ''}" 
             data-team-id="${game.awayTeam.id}"
             ${!isLocked && onSelect ? `onclick="window.selectTeam('${game.id}', '${game.awayTeam.id}')"` : ''}>
          <div class="team-info">
            <img src="${game.awayTeam.logo}" alt="${game.awayTeam.name}" class="team-logo" />
            <span class="team-name">${game.awayTeam.abbreviation}</span>
          </div>
          ${isLive || isCompleted ? `<span class="team-score">${game.awayTeam.score}</span>` : ''}
          ${game.awayTeam.winner ? '<span style="color: var(--color-neon-green);">✓</span>' : ''}
        </div>
        
        <div class="team ${homeSelected ? 'selected' : ''}" 
             data-team-id="${game.homeTeam.id}"
             ${!isLocked && onSelect ? `onclick="window.selectTeam('${game.id}', '${game.homeTeam.id}')"` : ''}>
          <div class="team-info">
            <img src="${game.homeTeam.logo}" alt="${game.homeTeam.name}" class="team-logo" />
            <span class="team-name">${game.homeTeam.abbreviation}</span>
          </div>
          ${isLive || isCompleted ? `<span class="team-score">${game.homeTeam.score}</span>` : ''}
          ${game.homeTeam.winner ? '<span style="color: var(--color-neon-green);">✓</span>' : ''}
        </div>
      </div>
      
      ${userPick && isCompleted ? `
        <div class="card-footer">
          ${userPick.is_correct
                ? '<span class="badge badge-win">WIN</span>'
                : '<span class="badge badge-loss">LOSS</span>'}
        </div>
      ` : ''}
    </div>
  `;
}
