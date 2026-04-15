import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DemoBoard } from './DemoBoard';
import { useLang } from '@/i18n';
import styles from './TutorialFlow.module.css';

// ── Inline SVG unit icons (miniature 240×240 viewBox) ─────────────────────
function ShieldIcon() {
  return (
    <svg viewBox="0 0 240 240" className={styles.unitSvg}>
      <defs>
        <linearGradient id="tut-g-shield" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="120" y2="240">
          <stop offset="0%"   stopColor="#fffbe8" />
          <stop offset="55%"  stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#a07830" />
        </linearGradient>
      </defs>
      <g style={{ fill: 'url(#tut-g-shield)', fillRule: 'evenodd', stroke: 'rgba(255,235,140,0.4)', strokeWidth: 4, vectorEffect: 'non-scaling-stroke' }}>
        <path d="M112.636,229.158c0,0 -31.131,-17.534 -56.027,-45.471c-17.852,-20.033 -32.154,-45.289 -32.154,-72.973l0,-104.025l191.091,0l0,104.025c0,27.684 -14.302,52.94 -32.154,72.973c-24.896,27.938 -56.028,45.472 -56.027,45.471l-7.365,4.153l-7.364,-4.153Zm7.364,-30.691c9.506,-6.223 26.48,-18.433 41.003,-34.731c13.081,-14.679 24.555,-32.737 24.555,-53.022l0,-74.037l-131.116,0l0,74.037c0,20.286 11.473,38.343 24.555,53.022c14.523,16.298 31.498,28.508 41.004,34.731Z" />
        <path d="M120,62.517l42.165,42.165l-42.165,42.165l-42.165,-42.165l42.165,-42.165Z" />
      </g>
    </svg>
  );
}

function RamIcon() {
  return (
    <svg viewBox="0 0 240 240" className={styles.unitSvg}>
      <defs>
        <linearGradient id="tut-g-ram" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="120" y2="240">
          <stop offset="0%"   stopColor="#fffbe8" />
          <stop offset="55%"  stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#a07830" />
        </linearGradient>
      </defs>
      <g style={{ fill: 'url(#tut-g-ram)', fillRule: 'evenodd' }}>
        <path d="M51.012,170.541l34.792,-17.4l-58.071,12.67l-13.251,-8.713l-5.098,-4.363l-4.937,-21.347l34.508,-48.14l30.142,-20.796l14.019,29.103l36.813,14.878l-24.022,21.094l43.736,31.211l-46.088,18.843l2.876,42.092l-39.58,-27.23l-5.84,-21.902Zm-4.56,-57.708l17.532,-2.96l4.856,-13.675l-14.689,2.354l-7.698,14.281Z" />
        <path d="M38.954,71.102l63.662,-45.042l-54.45,8.238l-9.211,36.804Z" />
        <path d="M193.228,153.22l-11.53,15.946l-62.628,-45.353l42.38,-35.745l-5.706,21.86l19.119,0.45l-9.137,-42.452l-36.055,29.854l-38.004,-16.367l-12.238,-25.254l51.1,-35.832l10.392,0.093l5.182,27.801l5.972,-27.701l21.64,0.194l5.127,27.508l5.909,-27.409l15.538,0.139l11.733,24.534l-20.152,14.013l24.358,-5.218l9.863,20.622l-20.771,14.444l25.107,-5.378l5.125,10.717l-17.463,24.15l-22.812,-10.204l17.051,18.172l-13.502,18.673l-22.166,-9.915l16.568,17.658Z" />
      </g>
    </svg>
  );
}

function WarriorIcon() {
  return (
    <svg viewBox="0 0 240 240" className={styles.unitSvg}>
      <defs>
        <linearGradient id="tut-g-warrior" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="120" y2="240">
          <stop offset="0%"   stopColor="#fffbe8" />
          <stop offset="55%"  stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#a07830" />
        </linearGradient>
      </defs>
      <g style={{ fill: 'url(#tut-g-warrior)', fillRule: 'evenodd', stroke: 'rgba(255,235,140,0.4)', strokeWidth: 4, vectorEffect: 'non-scaling-stroke' }}>
        <path d="M79.744,28.469l8.202,80.779l-22.978,-11.797l0,20.313l42.969,26.794l-7.653,92.347l-61.925,-70.057l9.422,-120.961l31.964,-17.419Zm89.912,89.294l0,-20.313l-22.064,11.328l8.109,-79.862l31.143,16.971l14.797,120.961l-67.301,70.057l-7.653,-92.347l42.969,-26.794Z" />
        <path d="M139.219,3.095l-11.573,113.98l-19.801,0l-11.573,-113.98l42.948,0Z" />
      </g>
    </svg>
  );
}

function HookIcon() {
  return (
    <svg viewBox="0 0 240 240" className={styles.unitSvg}>
      <defs>
        <linearGradient id="tut-g-hook" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="120" y2="240">
          <stop offset="0%"   stopColor="#fffbe8" />
          <stop offset="55%"  stopColor="#c9a84c" />
          <stop offset="100%" stopColor="#a07830" />
        </linearGradient>
      </defs>
      <g style={{ fill: 'url(#tut-g-hook)', fillRule: 'evenodd' }}>
        <path d="M128.43,173.721l0,7.098l22.654,22.654l-31.085,31.085l-31.085,-31.085l22.786,-22.786l0,-6.783l-7.965,-7.965l0,-17.955l7.965,-7.965l0,-7.035l-7.965,-7.965l0,-17.955l7.965,-7.965l0,-5.821l-10.561,0l0,-42.358l38.512,-0l0,42.358l-11.221,0l0,6.005l7.781,7.781l0,17.955l-7.781,7.781l0,7.403l7.781,7.781l0,17.955l-7.781,7.781Zm-8.527,19.036l-8.337,8.337l8.425,7.324l8.337,-7.236l-8.425,-8.425Zm2.745,-82.461l-5.349,0l-0,11.491l5.349,-0l0,-11.491Zm-0,41.79l-5.349,0l-0,10.622l5.349,-0l0,-10.622Z" />
        <path d="M94.811,57.998l-54.398,-30.087l-19.152,91.271l45.915,61.904l-17.281,-56.775l17.36,-41.029l27.556,0l0,-25.283Z" />
        <path d="M145.429,57.998l54.398,-30.087l19.152,91.271l-45.915,61.904l17.281,-56.775l-17.36,-41.029l-27.556,0l0,-25.283Z" />
        <path d="M133.538,44.205l-25.319,0l12.66,-38.763l12.66,38.763Z" />
      </g>
    </svg>
  );
}

function CrownIcon({ color }: { color: 'gold' | 'silver' }) {
  const grad = color === 'gold'
    ? { top: '#fffbe8', mid: '#c9a84c', bot: '#a07830' }
    : { top: '#ffffff', mid: '#a8b4c0', bot: '#6a7a88' };
  return (
    <svg viewBox="0 0 4961 3508" className={styles.crownSvg}>
      <defs>
        <linearGradient id={`tut-crown-${color}`} gradientUnits="userSpaceOnUse" x1="2480" y1="0" x2="2480" y2="3508">
          <stop offset="0%"   stopColor={grad.top} />
          <stop offset="55%"  stopColor={grad.mid} />
          <stop offset="100%" stopColor={grad.bot} />
        </linearGradient>
      </defs>
      <g transform="matrix(0.900533,0,0,1.052265,228.983579,-95.376462)" style={{ fillRule: 'evenodd' }}>
        <path
          fill={`url(#tut-crown-${color})`}
          d="M4002.592,3296.176L997.408,3296.176L505.478,522.686L1796.783,1719.495L2500,218.744L3203.217,1719.495L4494.522,522.686L4002.592,3296.176ZM3565.06,2860.608L3742.177,1862.03L3030.655,2521.484L2500,1389.002L1969.345,2521.484L1422.854,2014.984L1257.823,1862.03L1434.94,2860.608L3565.06,2860.608Z"
        />
      </g>
    </svg>
  );
}

// ── Section separator ──────────────────────────────────────────────────────
function Divider() {
  return <div className={styles.divider} />;
}

// ── Main component ─────────────────────────────────────────────────────────
export function TutorialFlow() {
  const navigate = useNavigate();
  const t = useLang();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className={styles.page}>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>{t.tutorial.howToPlay} <span className={styles.heroTitleBrand}>THRONES&nbsp;?</span></h1>
        </div>
        <div className={styles.demoBoardWrap}>
          <DemoBoard />
        </div>
      </section>

      <Divider />

      {/* ── Objectif ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.tutorial.objective}</h2>
        <div className={styles.objectiveCard}>
          <div className={styles.objectiveCrowns}>
            <CrownIcon color="gold" />
            <div className={styles.objectiveVs}>VS</div>
            <CrownIcon color="silver" />
          </div>
          <p className={styles.objectiveText}>
            {t.tutorial.objectiveText}
          </p>
        </div>
      </section>

      <Divider />

      {/* ── Règle de base ────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.tutorial.oneActionPerTurn}</h2>
        <div className={styles.rulesGrid}>
          <div className={styles.ruleCard}>
            <div className={styles.ruleText}><strong>{t.tutorial.move}</strong></div>
          </div>
          <div className={styles.ruleOr}>{t.tutorial.or}</div>
          <div className={styles.ruleCard}>
            <div className={styles.ruleText}><strong>{t.tutorial.attack}</strong></div>
          </div>
          <div className={styles.ruleOr}>{t.tutorial.or}</div>
          <div className={styles.ruleCard}>
            <div className={styles.ruleText}><strong>{t.tutorial.respawn}</strong></div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Les unités ───────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.tutorial.units}</h2>
        <div className={styles.unitsGrid}>

          <div className={styles.unitCard}>
            <div className={styles.unitIconWrap}><ShieldIcon /></div>
            <div className={styles.unitInfo}>
              <div className={styles.unitName}>{t.units.SHIELD}</div>
              <div className={styles.unitRole}>{t.tutorial.shieldRole}</div>
              <ul className={styles.unitList}>
                <li>{t.tutorial.shieldMove}</li>
                <li>{t.tutorial.shieldZoc}</li>
                <li>{t.tutorial.shieldWeakness}</li>
              </ul>
            </div>
          </div>

          <div className={styles.unitCard}>
            <div className={styles.unitIconWrap}><RamIcon /></div>
            <div className={styles.unitInfo}>
              <div className={styles.unitName}>{t.units.RAM}</div>
              <div className={styles.unitRole}>{t.tutorial.ramRole}</div>
              <ul className={styles.unitList}>
                <li>{t.tutorial.ramMove}</li>
                <li>{t.tutorial.ramJump}</li>
                <li>{t.tutorial.ramWeakness}</li>
              </ul>
            </div>
          </div>

          <div className={styles.unitCard}>
            <div className={styles.unitIconWrap}><WarriorIcon /></div>
            <div className={styles.unitInfo}>
              <div className={styles.unitName}>{t.units.WARRIOR}</div>
              <div className={styles.unitRole}>{t.tutorial.warriorRole}</div>
              <ul className={styles.unitList}>
                <li>{t.tutorial.warriorMove}</li>
                <li>{t.tutorial.warriorSpecial}</li>
                <li>{t.tutorial.warriorWeakness}</li>
              </ul>
            </div>
          </div>

          <div className={styles.unitCard}>
            <div className={styles.unitIconWrap}><HookIcon /></div>
            <div className={styles.unitInfo}>
              <div className={styles.unitName}>{t.units.HOOK}</div>
              <div className={styles.unitRole}>{t.tutorial.hookRole}</div>
              <ul className={styles.unitList}>
                <li>{t.tutorial.hookMove}</li>
                <li>{t.tutorial.hookAbility}</li>
                <li><em>{t.tutorial.hookWeakness}</em></li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      <Divider />

      {/* ── Stun ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.tutorial.stunTitle}</h2>
        <div className={styles.stunBlock}>
          <div className={styles.stunIcon}>
            <img src="/assets/tuto_hook.png" className={styles.stunHookImg} alt={t.units.HOOK} />
          </div>
          <div className={styles.stunText}>
            <p>{t.tutorial.stunText1}</p>
            <p>{t.tutorial.stunText2}</p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Les Tours ────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.tutorial.towersTitle}</h2>
        <p className={styles.sectionIntro}>{t.tutorial.towersIntro}</p>
        <div className={styles.towerGrid}>

          <div className={`${styles.towerCard} ${styles.towerActive}`}>
            <div className={styles.towerStatus}>{t.tutorial.towerActive}</div>
            <img src="/assets/tour_yes.png" className={styles.towerIllus} alt="" />
            <p>{t.tutorial.towerActiveDesc}</p>
          </div>

          <div className={`${styles.towerCard} ${styles.towerBlocked}`}>
            <div className={styles.towerStatus}>{t.tutorial.towerBlocked}</div>
            <img src="/assets/tour_non.png" className={styles.towerIllus} alt="" />
            <p>{t.tutorial.towerBlockedDesc}</p>
          </div>

          <div className={`${styles.towerCard} ${styles.towerInactive}`}>
            <div className={styles.towerStatus}>{t.tutorial.towerInactive}</div>
            <img src="/assets/tour_null.png" className={styles.towerIllus} alt="" />
            <p>{t.tutorial.towerInactiveDesc}</p>
          </div>

        </div>
        <p className={styles.ruleNote}>{t.tutorial.towerNote}</p>
      </section>

      <Divider />

      {/* ── Nul ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.tutorial.drawTitle}</h2>
        <ul className={styles.drawList}>
          <li><strong>{t.tutorial.drawRepetitionLabel}</strong> {t.tutorial.drawRepetitionBody}</li>
          <li><strong>{t.tutorial.drawStagnationLabel}</strong> {t.tutorial.drawStagnationBody}</li>
          <li><strong>{t.tutorial.drawMutualLabel}</strong> {t.tutorial.drawMutualBody}</li>
        </ul>
      </section>

      <Divider />

      {/* ── Classement & ELO ─────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t.tutorial.rankedTitle}</h2>

        {/* Ce qui compte vs ce qui ne compte pas */}
        <div className={styles.rankedImpact}>
          <div className={styles.rankedImpactYes}>
            <span className={styles.rankedImpactIcon}>✓</span>
            <div>
              <div className={styles.rankedImpactLabel}>{t.tutorial.rankedCounts}</div>
              <div className={styles.rankedImpactDesc}>{t.tutorial.rankedCountsDesc}</div>
            </div>
          </div>
          <div className={styles.rankedImpactNo}>
            <span className={styles.rankedImpactIcon}>✗</span>
            <div>
              <div className={styles.rankedImpactLabel}>{t.tutorial.rankedNoCounts}</div>
              <div className={styles.rankedImpactDesc}>{t.tutorial.rankedNoCountsDesc}</div>
            </div>
          </div>
        </div>

        {/* ELO explanation */}
        <div className={styles.rankedFlow}>
          <div className={styles.rankedFlowStep}>
            <div className={styles.rankedFlowNum}>?</div>
            <div>
              <div className={styles.rankedFlowTitle}>{t.tutorial.eloWhat}</div>
              <div className={styles.rankedFlowBody}>{t.tutorial.eloWhatDesc}</div>
            </div>
          </div>
          <div className={styles.rankedFlowStep}>
            <div className={styles.rankedFlowNum}>↑</div>
            <div>
              <div className={styles.rankedFlowTitle}>{t.tutorial.eloWin}</div>
              <div className={styles.rankedFlowBody}>{t.tutorial.eloWinDesc}</div>
            </div>
          </div>
          <div className={styles.rankedFlowStep}>
            <div className={styles.rankedFlowNum}>↓</div>
            <div>
              <div className={styles.rankedFlowTitle}>{t.tutorial.eloLose}</div>
              <div className={styles.rankedFlowBody}>{t.tutorial.eloLoseDesc}</div>
            </div>
          </div>
        </div>

        <p className={styles.eloNote}>{t.tutorial.eloNote}</p>

      </section>

      <Divider />

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className={styles.ctaSection}>
        <button className={styles.ctaBtn} onClick={() => setShowModal(true)}>
          {t.tutorial.playNow}
        </button>
        <button className={styles.menuBtn} onClick={() => navigate('/')}>
          {t.tutorial.backToMenu}
        </button>
      </section>

      {/* ── Mode modal ───────────────────────────────────────── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modalBox} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>{t.tutorial.chooseMode}</div>
            <button className={styles.modalBtn} onClick={() => navigate('/game?mode=local')}>
              {t.tutorial.playLocal}
            </button>
            <button className={styles.modalBtn} onClick={() => navigate('/game?mode=ai')}>
              {t.tutorial.playAI}
            </button>
            <button className={styles.modalBtnDisabled} disabled>
              {t.tutorial.playOnlineSoon}
            </button>
            <button className={styles.modalCancel} onClick={() => setShowModal(false)}>
              {t.tutorial.cancel}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
