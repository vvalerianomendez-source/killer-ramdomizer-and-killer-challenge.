import { useEffect, useState } from "react";
import "./App.css";
import { killers } from "./data/killers";
import { matches } from "./data/matches";

function App() {
  const [selectedKiller, setSelectedKiller] = useState(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [kills, setKills] = useState(null);
  const [hooks, setHooks] = useState("");
  const [showAllProgress, setShowAllProgress] = useState(false);
  const [detailKiller, setDetailKiller] = useState(null);
  const [sessionMatches, setSessionMatches] = useState([]);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [rollingKillerId, setRollingKillerId] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [winnerKillerId, setWinnerKillerId] = useState(null);

  const [matchesData, setMatchesData] = useState(() => {
    const savedMatches = localStorage.getItem("dbdMatches");

    if (savedMatches) {
      try {
        return JSON.parse(savedMatches);
      } catch {
        return matches;
      }
    }

      localStorage.setItem("dbdMatches", JSON.stringify(matches));
  return matches;
});

const [challengeCompletedIds, setChallengeCompletedIds] = useState(() => {
  const savedChallenge = localStorage.getItem("dbdChallengeCompletedIds");

  if (savedChallenge) {
    try {
      return JSON.parse(savedChallenge);
    } catch {
      return [];
    }
  }

  const savedMatches = localStorage.getItem("dbdMatches");
  const baseMatches = savedMatches ? JSON.parse(savedMatches) : matches;

  return killers
    .filter((killer) =>
      baseMatches.some(
        (match) => match.killerId === killer.id && match.kills >= 3
      )
    )
    .map((killer) => killer.id);
});

useEffect(() => {
    localStorage.setItem("dbdMatches", JSON.stringify(matchesData));
  }, [matchesData]);

  useEffect(() => {
    localStorage.setItem(
      "dbdChallengeCompletedIds",
      JSON.stringify(challengeCompletedIds)
    );
  }, [challengeCompletedIds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatSessionTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");

    return `${hrs}:${mins}:${secs}`;
  };

  const allMatches = matchesData;

  const victories = allMatches.filter((m) => m.kills >= 3).length;
  const draws = allMatches.filter((m) => m.kills === 2).length;
  const defeats = allMatches.filter((m) => m.kills <= 1).length;
  const totalMatches = allMatches.length;
  const totalKills = allMatches.reduce((sum, m) => sum + m.kills, 0);
  const totalHooks = allMatches.reduce((sum, m) => sum + m.hooks, 0);
  const total4Ks = allMatches.filter((m) => m.kills === 4).length;

  const winrate =
    totalMatches > 0
      ? ((victories / totalMatches) * 100).toFixed(1)
      : "0.0";

  const sessionVictories = sessionMatches.filter((m) => m.kills >= 3).length;
  const sessionDraws = sessionMatches.filter((m) => m.kills === 2).length;
  const sessionDefeats = sessionMatches.filter((m) => m.kills <= 1).length;
  const sessionKills = sessionMatches.reduce((sum, m) => sum + m.kills, 0);
  const sessionHooks = sessionMatches.reduce((sum, m) => sum + m.hooks, 0);
  const session4Ks = sessionMatches.filter((m) => m.kills === 4).length;
  const sessionRecentHistory = sessionMatches.slice(-10).map((m) => {
  if (m.kills >= 3) return "V";
  if (m.kills === 2) return "E";
  return "D";
});
    const getKillerStats = (killer) => {
    const killerMatches = allMatches.filter(
      (match) => match.killerId === killer.id
    );

    const killerVictories = killerMatches.filter(
      (match) => match.kills >= 3
    ).length;

    const killerFourKs = killerMatches.filter(
      (match) => match.kills === 4
    ).length;

    const killerWinrate =
      killerMatches.length > 0
        ? (killerVictories / killerMatches.length) * 100
        : 0;

    return {
      ...killer,
      matches: killerMatches.length,
      victories: killerVictories,
      fourKs: killerFourKs,
      winrate: killerWinrate,
    };
  };

  const killersStats = killers.map(getKillerStats);

  const mostPlayedKiller = killersStats.reduce(
    (best, killer) => (killer.matches > best.matches ? killer : best),
    killersStats[0]
  );

  const mostVictoriesKiller = killersStats.reduce(
    (best, killer) => (killer.victories > best.victories ? killer : best),
    killersStats[0]
  );

  const mostFourKsKiller = killersStats.reduce(
    (best, killer) => (killer.fourKs > best.fourKs ? killer : best),
    killersStats[0]
  );

  const bestWinrateKiller = killersStats
    .filter((killer) => killer.matches > 0)
    .reduce(
      (best, killer) => (killer.winrate > best.winrate ? killer : best),
      { name: "Sin datos", winrate: 0 }
    );

  const currentStreak = [...allMatches]
    .reverse()
    .reduce(
      (acc, match) => {
        if (acc.stopped) return acc;

        if (match.kills >= 3) {
          return { count: acc.count + 1, stopped: false };
        }

        return { count: acc.count, stopped: true };
      },
      { count: 0, stopped: false }
    ).count;

  const completedKillers = killers.filter((killer) =>
    challengeCompletedIds.includes(killer.id)
  );

  const challengeProgress =
    killers.length > 0
      ? ((completedKillers.length / killers.length) * 100).toFixed(1)
      : "0.0";

  const nextObjective = killers.find(
    (killer) => !challengeCompletedIds.includes(killer.id)
  );

  const pendingKillers = killers.length - completedKillers.length;

  const isKillerCompleted = (killerId) => {
    return challengeCompletedIds.includes(killerId);
  };

  const currentKillerMatches = selectedKiller
    ? allMatches.filter((match) => match.killerId === selectedKiller.id)
    : [];

  const currentKillerVictories = currentKillerMatches.filter(
    (m) => m.kills >= 3
  ).length;

  const currentKillerDraws = currentKillerMatches.filter(
    (m) => m.kills === 2
  ).length;

  const currentKillerDefeats = currentKillerMatches.filter(
    (m) => m.kills <= 1
  ).length;

  const currentKiller4Ks = currentKillerMatches.filter(
    (m) => m.kills === 4
  ).length;

  const currentKillerWinrate =
    currentKillerMatches.length > 0
      ? ((currentKillerVictories / currentKillerMatches.length) * 100).toFixed(1)
      : "0.0";

  const randomizeKiller = () => {
    if (isRolling) return;

    setIsRolling(true);
    setSelectedKiller(null);
    setWinnerKillerId(null);
    setShowMatchForm(false);
    setKills(null);
    setHooks("");

    const darkSound = new Audio("/sounds/dbd_dark.mp3");
    darkSound.volume = 0.09;
    darkSound.play().catch(() => {});

    const finalIndex = Math.floor(Math.random() * killers.length);
    const totalSteps = killers.length * 2 + finalIndex;

    let index = 0;
    let speed = 45;

    const roll = () => {
      const currentIndex = index % killers.length;
      const currentKiller = killers[currentIndex];

      setRollingKillerId(currentKiller.id);

      if (index >= totalSteps) {
        setSelectedKiller(currentKiller);
        setDetailKiller(currentKiller);
        setRollingKillerId(currentKiller.id);
        setWinnerKillerId(currentKiller.id);
        setIsRolling(false);

        setTimeout(() => {
          setWinnerKillerId(null);
        }, 1400);

        return;
      }

      index++;

      if (index > totalSteps - 10) {
        speed += 25;
      }

      setTimeout(roll, speed);
    };

    roll();
  };
    const selectMissingKiller = () => {
    const missingKillers = killers.filter(
      (killer) => !isKillerCompleted(killer.id)
    );

    if (missingKillers.length === 0) {
      alert("Ya completaste todos los killers");
      return;
    }

    const nextMissing = missingKillers[0];

    setSelectedKiller(nextMissing);
    setDetailKiller(nextMissing);
    setShowMatchForm(false);
    setKills(null);
    setHooks("");
  };

  const resetAllKillerChallenge = () => {
    const confirmReset = window.confirm(
      "¿Seguro que quieres reiniciar solo el progreso del All Killer Challenge? Tus estadísticas y partidas guardadas NO se borrarán."
    );

    if (!confirmReset) return;

    setChallengeCompletedIds([]);
    localStorage.setItem("dbdChallengeCompletedIds", JSON.stringify([]));
  };

  const resetSession = () => {
  setSessionMatches([]);
  setSessionSeconds(0);
};

const saveMatch = () => {
  if (!selectedKiller) return;

    if (kills === null) {
      alert("Selecciona los kills obtenidos");
      return;
    }

    const newMatch = {
      killerId: selectedKiller.id,
      kills,
      hooks: Number(hooks) || 0,
    };

    const updatedMatches = [...matchesData, newMatch];

    setMatchesData(updatedMatches);
    localStorage.setItem("dbdMatches", JSON.stringify(updatedMatches));
    setSessionMatches([...sessionMatches, newMatch]);

    let updatedChallengeIds = [...challengeCompletedIds];

    if (kills >= 3 && !updatedChallengeIds.includes(selectedKiller.id)) {
      updatedChallengeIds.push(selectedKiller.id);
      setChallengeCompletedIds(updatedChallengeIds);
    }

    const nextMissingKiller = killers.find(
      (killer) => !updatedChallengeIds.includes(killer.id)
    );

    if (kills >= 3 && nextMissingKiller) {
      setSelectedKiller(nextMissingKiller);
      setDetailKiller(nextMissingKiller);
    }

    setKills(null);
    setHooks("");
    setShowMatchForm(false);
  };

    return (
    <div className="app overlay-app">

      <div className="top-esports-bar">
        <div className="top-info-card">
          <span>VICTORIAS</span>
          <strong className="green">{victories}</strong>
        </div>

        <div className="top-info-card">
          <span>WINRATE</span>
          <strong>{winrate}%</strong>
        </div>

        <div className="top-title-card">
          <h1>ALL KILLER CHALLENGE</h1>
          <p>Dead by Daylight Killer Randomizer</p>
        </div>

        <div className="top-info-card">
          <span>RACHA</span>
          <strong>{currentStreak} 🔥</strong>
        </div>

        <div className="top-info-card">
          <span>COMPLETADOS</span>
          <strong>{completedKillers.length}/{killers.length}</strong>
        </div>
      </div>

      <div className="overlay-main">
        <div className="left-panel selector-panel">
          <div className="header">
            <h2>💀 KILLER RANDOMIZER</h2>
            <span>{killers.length}/{killers.length}</span>
          </div>

          <div className="killer-grid">
            {killers.map((killer) => (
              <div
                key={killer.id}
                className={`killer-card ${
                  selectedKiller?.id === killer.id ? "selected" : ""
                } ${
                  rollingKillerId === killer.id ? "rolling-selected" : ""
                } ${
                  winnerKillerId === killer.id ? "winner-selected" : ""
                }`}
              >
                <img src={killer.image} alt={killer.name} />
              </div>
            ))}
          </div>

          <button
            className="random-btn"
            onClick={randomizeKiller}
            disabled={isRolling}
          >
            {isRolling ? "🎰 SELECCIONANDO..." : "🎲 RANDOMIZAR KILLER"}
          </button>
        </div>
                <div className="right-panel spotlight-panel">
          <h2>KILLER SELECCIONADO</h2>

          {selectedKiller ? (
            <>
              <img
                src={selectedKiller.image}
                alt={selectedKiller.name}
                className="selected-image"
              />

              <h1>{selectedKiller.name}</h1>

              <div className="selected-killer-subtitle">
                ALL KILLER CHALLENGE TARGET
              </div>

              <div className="selected-killer-stats">
                <div>
                  <span>Victorias</span>
                  <strong className="green">{currentKillerVictories}</strong>
                </div>

                <div>
                  <span>Empates</span>
                  <strong className="yellow">{currentKillerDraws}</strong>
                </div>

                <div>
                  <span>Derrotas</span>
                  <strong className="red">{currentKillerDefeats}</strong>
                </div>

                <div>
                  <span>Winrate</span>
                  <strong>{currentKillerWinrate}%</strong>
                </div>

                <div>
                  <span>4Ks</span>
                  <strong>{currentKiller4Ks}</strong>
                </div>
              </div>

              <div className="buttons">
                <button className="accept" onClick={saveMatch}>
                  ✓ GUARDAR
                </button>

                <button className="reroll" onClick={randomizeKiller}>
                  ↻ REROLL
                </button>
              </div>

              <div className="match-form">
                <h3>RESULTADO</h3>

                <div className="kills-row">
                  {[0, 1, 2, 3, 4].map((killNumber) => (
                    <button
                      key={killNumber}
                      className={`kill-btn ${
                        kills === killNumber ? "active-kill" : ""
                      }`}
                      onClick={() => setKills(killNumber)}
                    >
                      {killNumber}K
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  placeholder="Hooks"
                  value={hooks}
                  onChange={(e) => setHooks(e.target.value)}
                  className="hooks-input"
                />

                <button className="save-match" onClick={saveMatch}>
                  GUARDAR PARTIDA
                </button>
              </div>
            </>
          ) : (
            <div className="placeholder">
              {isRolling ? "Seleccionando killer..." : "Presiona RANDOMIZAR"}
            </div>
          )}
        </div>

        <div className="challenge-panel challenge-side">
          <h3>🏆 RETO ACTUAL</h3>
          <h2>ALL KILLER CHALLENGE</h2>

          <div className="challenge-number">
            {completedKillers.length} / {killers.length}
          </div>

          <p>KILLERS COMPLETADOS</p>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${challengeProgress}%` }}
            />
          </div>

          <div className="progress-text">{challengeProgress}%</div>

          <div className="challenge-summary">
            <div>
              <span>COMPLETADOS</span>
              <strong>{completedKillers.length}</strong>
            </div>

            <div>
              <span>PENDIENTES</span>
              <strong>{pendingKillers}</strong>
            </div>

            <div>
              <span>SIGUIENTE</span>
              <strong>{nextObjective ? nextObjective.name : "COMPLETO"}</strong>
            </div>
          </div>

          <button
            className="missing-killer-btn"
            onClick={selectMissingKiller}
          >
            🎯 SELECCIONAR FALTANTE
          </button>

          <div className="next-objective-panel">
            <h4>SIGUIENTE OBJETIVO</h4>

            {nextObjective ? (
              <div className="next-objective-card">
                <img src={nextObjective.image} alt={nextObjective.name} />
                <span>{nextObjective.name}</span>
              </div>
            ) : (
              <div className="next-objective-complete">
                CHALLENGE COMPLETADO
              </div>
            )}
          </div>

          <div className="killer-progress-panel">
            <div className="killer-progress-header">
              <h3>🎯 PROGRESO</h3>
              <span>{completedKillers.length}/{killers.length}</span>
            </div>

            <div className="killer-progress-grid">
              {(showAllProgress ? killers : killers.slice(0, 14)).map(
                (killer) => (
                  <div
                    key={killer.id}
                    className={`progress-killer-card ${
                      isKillerCompleted(killer.id)
                        ? "killer-completed"
                        : "killer-pending"
                    } ${
                      detailKiller?.id === killer.id
                        ? "killer-detail-selected"
                        : ""
                    }`}
                    onClick={() => setDetailKiller(killer)}
                    title={killer.name}
                  >
                    <img src={killer.image} alt={killer.name} />
                  </div>
                )
              )}
            </div>

            <button
              className="view-all-killers-btn"
              onClick={() => setShowAllProgress(!showAllProgress)}
            >
              {showAllProgress ? "VER MENOS" : "VER TODOS"}
            </button>
          </div>
        </div>
      </div>
            <div className="overlay-bottom">
        <div className="stats-panel">
          <h3>📈 ESTADÍSTICAS ACTUALES</h3>

          <div className="stats-grid">
            <div className="stat-box">
              <span>VICTORIAS</span>
              <h2 className="green">{victories}</h2>
            </div>

            <div className="stat-box">
              <span>EMPATES</span>
              <h2 className="yellow">{draws}</h2>
            </div>

            <div className="stat-box">
              <span>DERROTAS</span>
              <h2 className="red">{defeats}</h2>
            </div>

            <div className="stat-box">
              <span>PARTIDAS</span>
              <h2>{totalMatches}</h2>
            </div>

            <div className="stat-box">
              <span>WINRATE</span>
              <h2>{winrate}%</h2>
            </div>

            <div className="stat-box">
              <span>RACHA</span>
              <h2>{currentStreak} 🔥</h2>
            </div>

            <div className="stat-box">
              <span>KILLER ACTUAL</span>
              <h2>{selectedKiller ? selectedKiller.name : "SIN SELECCIONAR"}</h2>
            </div>

            <div className="stat-box">
              <span>V / E / D DEL KILLER</span>
              <h2>
                <span className="green">V {currentKillerVictories}</span>{" "}
                <span className="yellow">E {currentKillerDraws}</span>{" "}
                <span className="red">D {currentKillerDefeats}</span>
              </h2>
            </div>

            <div className="stat-box">
              <span>WINRATE / 4K</span>
              <h2>{currentKillerWinrate}% / {currentKiller4Ks} 4K</h2>
            </div>

            <div className="stat-box">
              <span>TIEMPO SESIÓN</span>
              <h2>{formatSessionTime(sessionSeconds)}</h2>
            </div>

            <div className="stat-box">
              <span>SESIÓN</span>
              <button className="mini-reset-btn" onClick={resetSession}>
                REINICIAR SESIÓN
              </button>
            </div>

            <div className="stat-box">
              <span>CHALLENGE</span>
              <button
                className="mini-reset-btn danger"
                onClick={resetAllKillerChallenge}
              >
                REINICIAR CHALLENGE
              </button>
            </div>
          </div>
        </div>

        <div className="session-panel">
          <h3>📊 SESIÓN ACTUAL</h3>

          <div className="session-grid">
            <div className="session-box session-time-box">
              <span>TIEMPO</span>
              <h2>{formatSessionTime(sessionSeconds)}</h2>
            </div>

            <div className="session-history">
  <span>ÚLTIMAS 10</span>

  <div className="session-history-list">
    {sessionRecentHistory.length === 0 ? (
      <p>Sin partidas</p>
    ) : (
      sessionRecentHistory.map((item, index) => (
        <div
          key={index}
          className={`session-history-item ${
            item === "V"
              ? "history-win"
              : item === "E"
              ? "history-draw"
              : "history-loss"
          }`}
        >
          {item}
        </div>
      ))
    )}
  </div>
</div>

            <div className="session-box">
              <span>PARTIDAS</span>
              <h2>{sessionMatches.length}</h2>
            </div>

            <div className="session-box">
              <span>VICTORIAS</span>
              <h2 className="green">{sessionVictories}</h2>
            </div>

            <div className="session-box">
              <span>DERROTAS</span>
              <h2 className="red">{sessionDefeats}</h2>
            </div>
          </div>
        </div>

        <div className="performance-panel">
          <h3>🏆 MEJOR RENDIMIENTO</h3>

          <div className="performance-grid">
            <div className="performance-box">
              <span>KILLER MÁS JUGADO</span>
              <strong>{mostPlayedKiller?.name || "Sin datos"}</strong>
              <p>{mostPlayedKiller?.matches || 0} partidas</p>
            </div>

            <div className="performance-box">
              <span>MÁS VICTORIAS</span>
              <strong>{mostVictoriesKiller?.name || "Sin datos"}</strong>
              <p>{mostVictoriesKiller?.victories || 0} victorias</p>
            </div>

            <div className="performance-box">
              <span>MÁS 4Ks</span>
              <strong>{mostFourKsKiller?.name || "Sin datos"}</strong>
              <p>{mostFourKsKiller?.fourKs || 0} 4Ks</p>
            </div>

            <div className="performance-box">
              <span>MEJOR WINRATE</span>
              <strong>{bestWinrateKiller?.name || "Sin datos"}</strong>
              <p>{bestWinrateKiller?.winrate?.toFixed(1) || "0.0"}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
}

export default App;