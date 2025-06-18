import React, { useState, useEffect } from 'react';
import './ContrastTwinGraphic.css';

// Node layout for all steps
const contrastSensorImg = 'https://qualified-production.s3.us-east-1.amazonaws.com/uploads/2M2F3BKsEG4ufTWJzRE5S62WgnHQXUq1r4MS/e6846227e2b9af480dd662295b6569dc0e8565fba9116349766c6d252cb34c22.png';
const infraNodes = [
  { key: 'attacker', label: 'Attacker', x: 60, y: 120, icon: '🕵️‍♂️' },
  { key: 'thirdparty', label: '3rd Party', x: 300, y: 220, icon: '🔌' },
  { key: 'webapp', label: 'Web Application', x: 300, y: 120, icon: '🖥️' },
  { key: 'waf', label: 'Firewall/WAF', x: 440, y: 120, icon: '🛡️' },
  { key: 'server', label: 'Server', x: 580, y: 120, icon: '🖧' },
  { key: 'cloud', label: 'Cloud Storage', x: 720, y: 120, icon: '☁️' },
  { key: 'db', label: 'Database', x: 860, y: 120, icon: '🗄️' },
  // CVE, SOC, developer, third party will appear in later steps
];
const socNode = { key: 'soc', label: 'SOC', x: 720, y: 30, icon: '👮‍♂️' };
const devNode = { key: 'dev', label: 'Developer', x: 860, y: 220, icon: '👨‍💻' };

const scenarioSteps = [
  [
    '' // Step 1: no descriptive text
  ],
  [
    'There is a zero day vulnerability on a third party library a web application is using.',
    'An attacker is aware of this exploit and that a web application uses the library.'
  ],
  [
    'The attacker targets the vulnerable web application and sends a SQL injection attack.',
    'The attack bypasses the WAF and reaches the database and executes the SQL injection.'
  ],
  [
    'The Contrast sensor detects the attack.'
  ],
  [
    'An alert is generated and sent to the SOC and a security analyst begins investigation, confirms the attack, and blocks it.'
  ],
  [
    'Now that the attack is blocked and the web application is safe, an issue is created for the developer to make a code fix.',
    'The developer is armed with the library information and stack trace to apply the fix, making the application more secure.'
  ]
];

const featureStrings = [
  '',
  'Runtime attack detection and response. Visibility right into the application layer, uncovering zero-day attacks.',
  'See attacks on applications. Get real-time alerts that include crucial context and fewer false positives with enhanced attack intelligence and integrations with SIEM, CNAPP and XDR platforms.',
  'Guided security runbooks. Clear, actionable steps to quickly identify true positive attacks and contain threats.',
  'Guided developer runbooks. Clear, actionable steps to quickly fix vulnerable code and libraries.'
];

// Helper for animated line (growing effect)
type AnimatedLineProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  progress: number;
  stroke: string;
  strokeWidth: number;
  dashArray?: string;
  markerEnd?: string;
};
function AnimatedLine({ x1, y1, x2, y2, progress, stroke, strokeWidth, dashArray = '', markerEnd = '' }: AnimatedLineProps) {
  // Linear interpolation for growing line
  const dx = x2 - x1;
  const dy = y2 - y1;
  const x = x1 + dx * progress;
  const y = y1 + dy * progress;
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x}
      y2={y}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={dashArray}
      markerEnd={markerEnd || undefined}
    />
  );
}

export default function ContrastTwinGraphic() {
  const [step, setStep] = useState(0);
  const [stepTextIndex, setStepTextIndex] = useState(0);
  // Step 2 animation states
  const [showCVE, setShowCVE] = useState(false);
  const [cveLineProgress, setCveLineProgress] = useState(0);
  const [webappLineProgress, setWebappLineProgress] = useState(0);
  // Step 3+ animation states
  const [attackSegment, setAttackSegment] = useState(0); // 0: not started, 1: to webapp, 2: to waf, 3: to server, 4: to cloud, 5: to db, 6: done
  const [attackProgress, setAttackProgress] = useState(0); // 0 to 1 for current segment
  const [compromisedNodes, setCompromisedNodes] = useState<string[]>([]);
  // Step 4 animation states
  const [socLineProgress, setSocLineProgress] = useState(0);

  // Use the same SOC analyst position for both steps
  const socAnalystX = 600, socAnalystY = 30;

  // Animate step string: fade between sentences
  useEffect(() => {
    setStepTextIndex(0);
    setShowCVE(false);
    setCveLineProgress(0);
    setWebappLineProgress(0);
    setAttackSegment(0);
    setAttackProgress(0);
    setSocLineProgress(0);
    // Carry compromised state from end of step 3 to start of step 4
    if (step === 3) {
      setCompromisedNodes(['webapp', 'waf', 'server', 'cloud', 'db']);
    } else {
      setCompromisedNodes([]);
    }
    // Reset all animation states on step change
    // Reset all animation states on step change
    if (step === 1) {
      // Step 2 animation sequence: fade in CVE with first sentence, then animate lines with second sentence
      let raf1: number, raf2: number;
      setShowCVE(false);
      setCveLineProgress(0);
      setWebappLineProgress(0);
      // Show CVE node as soon as first sentence appears
      const t1 = setTimeout(() => setShowCVE(true), 200);
      // Animate lines only when second sentence is shown
      let timer: number | undefined;
      if (scenarioSteps[step].length > 1) {
        timer = setTimeout(() => {
          setStepTextIndex(1);
          // Animate lines after second sentence appears
          setTimeout(() => {
            const animateCveLine = () => {
              setCveLineProgress(p => {
                if (p < 1) {
                  raf1 = requestAnimationFrame(animateCveLine);
                  return Math.min(1, p + 0.04);
                }
                // After dashed line, animate solid line
                setTimeout(() => {
                  const animateWebappLine = () => {
                    setWebappLineProgress(p2 => {
                      if (p2 < 1) {
                        raf2 = requestAnimationFrame(animateWebappLine);
                        return Math.min(1, p2 + 0.04);
                      }
                      return 1;
                    });
                  };
                  animateWebappLine();
                }, 200);
                return 1;
              });
            };
            animateCveLine();
          }, 200);
        }, 3500); // was 2200, now slower for a longer pause
      }
      return () => {
        clearTimeout(t1);
        if (timer) clearTimeout(timer);
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }
    if (step === 2) {
      // Step 3: Animate solid line, pausing at each node, then mark all as compromised
      let raf: number;
      const segments = [
        { from: [60, 120], to: [300, 120], key: 'webapp' },
        { from: [300, 120], to: [440, 120], key: 'waf' },
        { from: [440, 120], to: [580, 120], key: 'server' },
        { from: [580, 120], to: [720, 120], key: 'cloud' },
        { from: [720, 120], to: [860, 120], key: 'db' },
      ];
      function animateSegment(seg: number) {
        setAttackSegment(seg + 1);
        setAttackProgress(0);
        const grow = () => {
          setAttackProgress(p => {
            if (p < 1) {
              raf = requestAnimationFrame(grow);
              return Math.min(1, p + 0.04);
            }
            // Pause at node, then continue to next segment
            if (seg < segments.length - 1) {
              setTimeout(() => animateSegment(seg + 1), 400);
            } else {
              // All segments done, mark all as compromised
              setTimeout(() => setCompromisedNodes(['webapp', 'waf', 'server', 'cloud', 'db']), 400);
            }
            return 1;
          });
        };
        grow();
      }
      setTimeout(() => animateSegment(0), 600);
      // Step string fade
      if (scenarioSteps[step].length > 1) {
        const timer = setTimeout(() => setStepTextIndex(1), 2200);
        return () => { clearTimeout(timer); cancelAnimationFrame(raf); };
      }
      return () => cancelAnimationFrame(raf);
    }
    if (step === 3) {
      // Step 4: Animate sensor light and analyst fade in, then blue line
      let raf: number;
      let timer: number | undefined;
      // Always show first sentence, then fade to second after a delay
      if (stepTextIndex === 0 && scenarioSteps[step].length > 1) {
        timer = window.setTimeout(() => {
          setStepTextIndex(1);
        }, 2200); // Adjust delay as needed
      }
      if (stepTextIndex === 1) {
        // Animate blue line from webapp to SOC
        const animateLine = () => {
          setSocLineProgress(p => {
            if (p < 1) {
              raf = requestAnimationFrame(animateLine);
              return Math.min(1, p + 0.04);
            }
            return 1;
          });
        };
        animateLine();
      }
      return () => { cancelAnimationFrame(raf); if (timer) clearTimeout(timer); };
    }
    if (step === 4) {
      // Step 4: lit sensor, SOC analyst appears (no line)
      // No animation needed, just show both
    }
    if (step === 5) {
      // Step 5: animate blue line from webapp to SOC
      let raf: number;
      const animateLine = () => {
        setSocLineProgress(p => {
          if (p < 1) {
            raf = requestAnimationFrame(animateLine);
            return Math.min(1, p + 0.04);
          }
          return 1;
        });
      };
      animateLine();
      return () => cancelAnimationFrame(raf);
    }
    if (step === 5) {
      // Remove legacy/unused code for SOC/dev/fix
      // setShowSOC(true);
      // setShowDev(true);
      // setSocAlertProgress(1);
      // setDevFixProgress(1);
      setTimeout(() => setStepTextIndex(1), 2200);
    }
  }, [step]);

  return (
    <div className="ctg-container">
      {/* Header section */}
      <div className="ctg-header" style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: '2rem', margin: 0 }}>
          Contrast Digital Security Twin for runtime attack detection and response.
        </h2>
        <div className="ctg-subtitle" style={{ color: '#00e6c3', fontWeight: 500, marginTop: '0.7rem', fontSize: '1.15rem' }}>
          Leverage visibility right into the application layer to uncover and block zero-day attacks.
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '2px solid #23293a', margin: '0 0 2.5rem 0', width: '100%' }} />
      {/* Main section: diagram, step string, feature string, controls */}
      <div className="ctg-main-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
        {/* Diagram placeholder with overlay logic for step 1 */}
        <div style={{ width: 950, height: 300, background: '#181c24', borderRadius: 12, marginBottom: 24, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
          {/* Base diagram for all steps */}
          <svg width={950} height={300}>
            {/* Dashed grey lines for connections */}
            <line x1={300} y1={120} x2={440} y2={120} stroke="#888" strokeWidth={3} strokeDasharray="8 8" opacity={0.6} />
            <line x1={440} y1={120} x2={580} y2={120} stroke="#888" strokeWidth={3} strokeDasharray="8 8" opacity={0.6} />
            <line x1={580} y1={120} x2={720} y2={120} stroke="#888" strokeWidth={3} strokeDasharray="8 8" opacity={0.6} />
            <line x1={720} y1={120} x2={860} y2={120} stroke="#888" strokeWidth={3} strokeDasharray="8 6" opacity={0.6} />
            {/* Third party below webapp connection */}
            <line x1={300} y1={120} x2={300} y2={220} stroke="#888" strokeWidth={3} strokeDasharray="8 8" opacity={0.6} />
            {infraNodes.map(node => (
              <g key={node.key}>
                <circle cx={node.x} cy={node.y} r={32} fill={'#23293a'} stroke={'#888'} strokeWidth={2} />
                <text x={node.x} y={node.y + 10} textAnchor="middle" fontSize={28} fill="#fff">{node.icon}</text>
                <text x={node.x} y={node.y + 48} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>{node.label}</text>
                {/* Overlay the Contrast sensor image on the web application */}
                {node.key === 'webapp' && (
                  <image
                    href={contrastSensorImg}
                    x={node.x - 18}
                    y={node.y - 50}
                    width={36}
                    height={36}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            ))}
            {/* Step 2: fade in CVE, animate lines */}
            {step === 1 && (
              <g>
                {/* CVE node fade in */}
                <g style={{ opacity: showCVE ? 1 : 0, transition: 'opacity 0.6s' }}>
                  <circle cx={200} cy={60} r={32} fill="#23293a" stroke="#888" strokeWidth={2} />
                  <text x={200} y={60 + 10} textAnchor="middle" fontSize={28} fill="#fff">⚡</text>
                  <text x={200} y={60 + 48} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>Zero-Day (CVE)</text>
                  <circle cx={200} cy={60} r={38} fill="#fff200" opacity={0.25} />
                </g>
                {/* Dashed red line (growing) from attacker to CVE */}
                {showCVE && cveLineProgress > 0 && (
                  <AnimatedLine x1={60} y1={120} x2={200} y2={60} progress={cveLineProgress} stroke="#e74c3c" strokeWidth={4} dashArray="8 6" />
                )}
                {/* Solid red line (growing) from attacker to webapp with arrow */}
                {cveLineProgress === 1 && webappLineProgress > 0 && (
                  <AnimatedLine x1={60} y1={120} x2={300} y2={120} progress={webappLineProgress} stroke="#e74c3c" strokeWidth={4} dashArray="8 6" />
                )}
                <defs>
                  <marker id="arrowhead" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="strokeWidth">
                    <polygon points="0 0, 12 6, 0 12" fill="#e74c3c" />
                  </marker>
                </defs>
              </g>
            )}
            {/* Step 2 and beyond: CVE node and attack lines persist */}
            {(step >= 1) && (
              <g>
                {/* CVE node fade in (always visible after step 2) */}
                <g style={{ opacity: (step === 1 ? (showCVE ? 1 : 0) : 1), transition: 'opacity 0.6s' }}>
                  <circle cx={200} cy={60} r={32} fill="#23293a" stroke="#888" strokeWidth={2} />
                  <text x={200} y={70} textAnchor="middle" fontSize={28} fill="#fff">⚡</text>
                  <text x={200} y={108} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>Zero-Day (CVE)</text>
                  <circle cx={200} cy={60} r={38} fill="#fff200" opacity={0.25} />
                </g>
                {/* Dashed red line (growing in step 2, static after) from attacker to CVE */}
                {(step === 1
                  ? (showCVE && cveLineProgress > 0 && <AnimatedLine x1={60} y1={120} x2={200} y2={60} progress={cveLineProgress} stroke="#e74c3c" strokeWidth={4} dashArray="8 6" />)
                  : <line x1={60} y1={120} x2={200} y2={60} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" />
                )}
                {/* Dashed red line (growing in step 2, static after) from attacker to webapp without arrow */}
                {((step === 1 && cveLineProgress === 1 && webappLineProgress > 0)
                  ? <AnimatedLine x1={60} y1={120} x2={300} y2={120} progress={webappLineProgress} stroke="#e74c3c" strokeWidth={4} dashArray="8 6" />
                  : (step > 1 && <line x1={60} y1={120} x2={300} y2={120} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" />)
                )}
                {/* Dashed red line (growing in step 2, static after) from webapp to third party */}
                {(step === 1
                  ? (webappLineProgress === 1 && <AnimatedLine x1={300} y1={120} x2={300} y2={220} progress={1} stroke="#e74c3c" strokeWidth={4} dashArray="8 6" />)
                  : (step > 1 && <line x1={300} y1={120} x2={300} y2={220} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" />)
                )}
                <defs>
                  <marker id="arrowhead" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="strokeWidth">
                    <polygon points="0 0, 12 6, 0 12" fill="#e74c3c" />
                  </marker>
                </defs>
              </g>
            )}
            {/* Step 3: attack line through infra, compromised state */}
            {step === 2 && (
              <g>
                {/* Animate solid line in segments, pausing at each node */}
                {(() => {
                  const segs = [
                    { from: [60, 120], to: [300, 120] },
                    { from: [300, 120], to: [440, 120] },
                    { from: [440, 120], to: [580, 120] },
                    { from: [580, 120], to: [720, 120] },
                    { from: [720, 120], to: [860, 120] },
                  ];
                  let lines = [];
                  for (let i = 0; i < attackSegment - 1; ++i) {
                    lines.push(
                      <line key={i} x1={segs[i].from[0]} y1={segs[i].from[1]} x2={segs[i].to[0]} y2={segs[i].to[1]} stroke="#e74c3c" strokeWidth={4} />
                    );
                  }
                  if (attackSegment > 0 && attackSegment <= segs.length) {
                    const seg = segs[attackSegment - 1];
                    lines.push(
                      <AnimatedLine key={"anim-"+attackSegment} x1={seg.from[0]} y1={seg.from[1]} x2={seg.to[0]} y2={seg.to[1]} progress={attackProgress} stroke="#e74c3c" strokeWidth={4} />
                    );
                  }
                  return lines;
                })()}
                {/* Compromised state: highlight all nodes after line reaches db */}
                {['webapp','waf','server','cloud','db'].map(key => compromisedNodes.includes(key) && (
                  <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                ))}
              </g>
            )}
            {/* Step 4: SOC node, alert line, dev node, fix line */}
            {/* (removed: all references to showSOC, socAlertProgress, showDev, devFixProgress, and their lines/nodes) */}
            {/* Step 4: show db node as safe (green highlight) */}
            {step === 4 && (
              <circle cx={860} cy={120} r={38} fill="#00e6c3" opacity={0.18} />
            )}
            {/* Step 3 & 4: attack line through infra, compromised state */}
            {(step === 2 || step === 3) && (
              <g>
                {/* Draw all attack line segments if step 3 is complete or in step 4 */}
                {(() => {
                  const segs = [
                    { from: [60, 120], to: [300, 120] },
                    { from: [300, 120], to: [440, 120] },
                    { from: [440, 120], to: [580, 120] },
                    { from: [580, 120], to: [720, 120] },
                    { from: [720, 120], to: [860, 120] },
                  ];
                  // In step 3, animate as before. In step 4, always show all segments.
                  if (step === 3 || (step === 2 && compromisedNodes.length === 5)) {
                    return segs.map((seg, i) => (
                      <line key={i} x1={seg.from[0]} y1={seg.from[1]} x2={seg.to[0]} y2={seg.to[1]} stroke="#e74c3c" strokeWidth={4} />
                    ));
                  }
                  // Incomplete step 3: show animated segments
                  let lines = [];
                  for (let i = 0; i < attackSegment - 1; ++i) {
                    lines.push(
                      <line key={i} x1={segs[i].from[0]} y1={segs[i].from[1]} x2={segs[i].to[0]} y2={segs[i].to[1]} stroke="#e74c3c" strokeWidth={4} />
                    );
                  }
                  if (attackSegment > 0 && attackSegment <= segs.length) {
                    const seg = segs[attackSegment - 1];
                    lines.push(
                      <AnimatedLine key={"anim-"+attackSegment} x1={seg.from[0]} y1={seg.from[1]} x2={seg.to[0]} y2={seg.to[1]} progress={attackProgress} stroke="#e74c3c" strokeWidth={4} />
                    );
                  }
                  return lines;
                })()}
                {/* Compromised state: highlight all nodes after line reaches db or in step 4 */}
                {['webapp','waf','server','cloud','db'].map(key => ((compromisedNodes.includes(key) || step === 3) && (
                  <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                )))}
              </g>
            )}
            {/* Step 4: sensor lights up, analyst appears, blue line animates */}
            {step === 3 && (
              <g>
                {/* Webapp pulse or light up (always visible in step 4) */}
                <circle cx={300} cy={120} r={38} fill="#00e6c3" opacity={0.25} className="ctg-pulse" />
                {/* SOC/Security Analyst user object (always visible in step 4) */}
                <g>
                  <circle cx={600} cy={60} r={32} fill="#23293a" stroke="#00e6c3" strokeWidth={2} />
                  <text x={600} y={70} textAnchor="middle" fontSize={28} fill="#fff">🧑‍💼</text>
                  <text x={600} y={108} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>SOC Analyst</text>
                </g>
                {/* Blue line from webapp to SOC/analyst (animated on second sentence) */}
                {stepTextIndex === 1 && socLineProgress > 0 && (
                  <AnimatedLine x1={300} y1={120} x2={600} y2={60} progress={socLineProgress} stroke="#00e6c3" strokeWidth={4} />
                )}
              </g>
            )}
            {/* Step 4: webapp lit, SOC/analyst visible, no line */}
            {step === 4 && (
              <g>
                {/* Brighter webapp sensor highlight */}
                <circle cx={300} cy={120} r={44} fill="#00fff0" opacity={0.45} style={{ filter: 'blur(2.5px)' }} />
                {/* SOC/Security Analyst user object (move higher in step 4) */}
                <g>
                  <circle cx={socAnalystX} cy={0} r={32} fill="#23293a" stroke="#00e6c3" strokeWidth={2} />
                  <text x={socAnalystX} y={10} textAnchor="middle" fontSize={28} fill="#fff">🧑‍💼</text>
                  <text x={socAnalystX} y={48} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>SOC Analyst</text>
                </g>
                {/* Red highlight on compromised nodes and attack line from webapp to db */}
                <line x1={60} y1={120} x2={300} y2={120} stroke="#e74c3c" strokeWidth={4} />
                <line x1={300} y1={120} x2={440} y2={120} stroke="#e74c3c" strokeWidth={4} />
                <line x1={440} y1={120} x2={580} y2={120} stroke="#e74c3c" strokeWidth={4} />
                <line x1={580} y1={120} x2={720} y2={120} stroke="#e74c3c" strokeWidth={4} />
                <line x1={720} y1={120} x2={860} y2={120} stroke="#e74c3c" strokeWidth={4} />
                {['webapp','waf','server','cloud','db'].map(key => (
                  <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                ))}
              </g>
            )}
            {/* Step 5: keep red highlight/attack line, animate blue line from sensor to SOC/analyst */}
            {step === 5 && (
              <g>
                {/* Brighter webapp sensor highlight */}
                <circle cx={300} cy={120} r={44} fill="#00fff0" opacity={0.45} style={{ filter: 'blur(2.5px)' }} />
                {/* SOC/Security Analyst user object (same position) */}
                <g>
                  <circle cx={socAnalystX} cy={socAnalystY} r={32} fill="#23293a" stroke="#00e6c3" strokeWidth={2} />
                  <text x={socAnalystX} y={socAnalystY + 10} textAnchor="middle" fontSize={28} fill="#fff">🧑‍💼</text>
                  <text x={socAnalystX} y={socAnalystY + 48} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>SOC Analyst</text>
                </g>
                {/* Red highlight on compromised nodes and attack line from webapp to db */}
                <line x1={60} y1={120} x2={300} y2={120} stroke="#e74c3c" strokeWidth={4} />
                <line x1={300} y1={120} x2={440} y2={120} stroke="#e74c3c" strokeWidth={4} />
                <line x1={440} y1={120} x2={580} y2={120} stroke="#e74c3c" strokeWidth={4} />
                <line x1={580} y1={120} x2={720} y2={120} stroke="#e74c3c" strokeWidth={4} />
                <line x1={720} y1={120} x2={860} y2={120} stroke="#e74c3c" strokeWidth={4} />
                {['webapp','waf','server','cloud','db'].map(key => (
                  <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                ))}
                {/* Blue line from contrast sensor (above webapp) to SOC/analyst (animated) */}
                {socLineProgress > 0 && (
                  <AnimatedLine x1={300} y1={102} x2={socAnalystX} y2={socAnalystY + 32} progress={socLineProgress} stroke="#00e6c3" strokeWidth={4} />
                )}
              </g>
            )}
            {/* ...existing defs for arrowhead... */}
            <defs>
              <marker id="arrowhead" markerWidth="12" markerHeight="12" refX="9" refY="6" orient="auto" markerUnits="strokeWidth">
                <polygon points="0 0, 12 6, 0 12" fill="#e74c3c" />
              </marker>
            </defs>
          </svg>
        </div>
        {/* Step string with fade animation */}
        <div className="ctg-step-desc" style={{ color: '#00e6c3', fontWeight: 600, fontSize: '1.15em', margin: '0 0 1.5em 0', textAlign: 'center', minHeight: 60, transition: 'opacity 0.5s', position: 'relative' }}>
          <span style={{ opacity: stepTextIndex === 0 ? 1 : 0, position: stepTextIndex === 0 ? 'static' : 'absolute', transition: 'opacity 0.5s' }}>
            {scenarioSteps[step][0]}
          </span>
          <span style={{ opacity: stepTextIndex === 1 ? 1 : 0, position: stepTextIndex === 1 ? 'static' : 'absolute', transition: 'opacity 0.5s' }}>
            {scenarioSteps[step][1]}
          </span>
        </div>
        {/* Feature string */}
        {featureStrings[step] && (
          <div className="ctg-feature-desc" style={{ color: '#fff', background: '#23293a', borderRadius: '0.5em', marginTop: '0.5em', padding: '0.8em 1em', fontSize: '1.05em', borderLeft: '4px solid #00e6c3', minWidth: 320 }}>
            {featureStrings[step]}
          </div>
        )}
        {/* Navigation buttons */}
        <div className="ctg-step-controls" style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <button className="ctg-trace-btn" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Previous Step
          </button>
          <span style={{ color: '#00e6c3', fontWeight: 600, fontSize: '1.1em', minWidth: 90, textAlign: 'center' }}>
            Step {step + 1} / {scenarioSteps.length}
          </span>
          <button className="ctg-trace-btn" onClick={() => setStep((s) => Math.min(s + 1, scenarioSteps.length - 1))} disabled={step === scenarioSteps.length - 1}>
            Next Step
          </button>
          <button className="ctg-trace-btn" onClick={() => setStep(0)}>
            Restart Scenario
          </button>
        </div>
      </div>
    </div>
  );
}
