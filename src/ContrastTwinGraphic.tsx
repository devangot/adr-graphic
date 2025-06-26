import React, { useState, useEffect, useRef } from 'react';
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
    'An alert is generated and sent to the SOC and a security analyst begins investigation'
  ],
  // New step 5: SOC analyst blocks the attack
  [
    'The SOC analyst confirms the attack and blocks it'
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
  'Guided security runbooks. Clear, actionable steps to quickly identify true positive attacks and contain threats.', // Step 5 now matches step 4
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
  opacity?: number;
};
function AnimatedLine({ x1, y1, x2, y2, progress, stroke, strokeWidth, dashArray = '', markerEnd = '', opacity = 1 }: AnimatedLineProps) {
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
      opacity={opacity}
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
  // Animation state for SOC analyst pop-in
  const [socPopIn, setSocPopIn] = useState(false);
  // Animation state for webapp glow
  const [webappGlow, setWebappGlow] = useState(false);
  // Animation state for blue line from SOC to webapp in step 5
  const [showBlueLine, setShowBlueLine] = useState(false);
  const [blueLineProgress, setBlueLineProgress] = useState(0);
  const [blueLineOpacity, setBlueLineOpacity] = useState(1);
  // Remove unused individual animation states for step 5 (now grouped in step5Anim)
  // const [redLineOpacity, setRedLineOpacity] = useState(1);
  // const [redNodeOpacity, setRedNodeOpacity] = useState(1);
  // const [attackerOpacity, setAttackerOpacity] = useState(1);
  // const [attackerScale, setAttackerScale] = useState(1);
  // const [socScale, setSocScale] = useState(1);
  // const [socOpacity, setSocOpacity] = useState(1);
  // const [webappBlueGlowOpacity, setWebappBlueGlowOpacity] = useState(1);

  // Centralized refs for animation frame and timeout IDs
  const animationRefs = useRef<{ rafs: number[]; timers: number[] }>({ rafs: [], timers: [] });

  // Helper to register and cleanup animation frames and timeouts
  const registerRaf = (id: number) => {
    animationRefs.current.rafs.push(id);
    return id;
  };
  const registerTimer = (id: number) => {
    animationRefs.current.timers.push(id);
    return id;
  };
  const cleanupAnimations = () => {
    animationRefs.current.rafs.forEach(id => cancelAnimationFrame(id));
    animationRefs.current.timers.forEach(id => clearTimeout(id));
    animationRefs.current.rafs = [];
    animationRefs.current.timers = [];
  };

  // Grouped animation state for step 5 (as an example)
  const [step5Anim, setStep5Anim] = useState({
    redLineOpacity: 1,
    redNodeOpacity: 1,
    attackerOpacity: 1,
    attackerScale: 1,
    socScale: 1,
    socOpacity: 1,
    webappBlueGlowOpacity: 1,
    showBlueLine: false,
    blueLineProgress: 0,
    blueLineOpacity: 1,
  });

  useEffect(() => {
    cleanupAnimations(); // Always cleanup on step change
    setStepTextIndex(0);
    setShowCVE(false);
    setCveLineProgress(0);
    setWebappLineProgress(0);
    setAttackSegment(0);
    setAttackProgress(0);
    setSocLineProgress(0);
    // Compromised nodes logic
    if (step === 3 || step === 4 || step === 5) {
      setCompromisedNodes(['webapp', 'waf', 'server', 'cloud', 'db']);
    } else {
      setCompromisedNodes([]);
    }
    // Step 1: CVE fade-in and line animation
    if (step === 1) {
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
    // Step 2: Attack line animation
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
    // Step 4: SOC pop-in, webapp glow, blue line
    if (step === 4) {
      setSocPopIn(false);
      setWebappGlow(false);
      setShowBlueLine(false);
      setBlueLineProgress(0);
      setBlueLineOpacity(1);
      setTimeout(() => {
        setSocPopIn(true);
        setWebappGlow(true);
        setTimeout(() => {
          setShowBlueLine(true);
          // Animate the blue line progress
          let raf: number;
          const animate = () => {
            setBlueLineProgress(p => {
              if (p < 1) {
                raf = requestAnimationFrame(animate);
                return Math.min(1, p + 0.04);
              }
              // After line is fully drawn, start fade out after a 2 second pause
              setTimeout(() => {
                const fade = () => {
                  setBlueLineOpacity(op => {
                    if (op > 0) {
                      requestAnimationFrame(fade);
                      return Math.max(0, op - 0.04);
                    }
                    return 0;
                  });
                };
                fade();
              }, 2000); // 2 second pause before fading out
              return 1;
            });
          };
          animate();
        }, 800); // Wait for pop-in/glow to finish
      }, 300);
    }
    // Step 5: SOC blocks attack, blue line reverse, fade out red lines/highlights
    if (step === 5) {
      setStep5Anim({
        redLineOpacity: 1,
        redNodeOpacity: 1,
        attackerOpacity: 1,
        attackerScale: 1,
        socScale: 1,
        socOpacity: 1,
        webappBlueGlowOpacity: 1,
        showBlueLine: false,
        blueLineProgress: 0,
        blueLineOpacity: 1,
      });
      // Animate blue line from SOC to webapp first
      registerTimer(setTimeout(() => {
        setStep5Anim(anim => ({ ...anim, showBlueLine: true }));
        const animate = () => {
          setStep5Anim(anim => {
            if (anim.blueLineProgress < 1) {
              registerRaf(requestAnimationFrame(animate));
              return { ...anim, blueLineProgress: Math.min(1, anim.blueLineProgress + 0.018) };
            }
            // After line is fully drawn, start fade out after a 2 second pause
            registerTimer(setTimeout(() => {
              const fadeBlue = () => {
                setStep5Anim(anim => {
                  if (anim.blueLineOpacity > 0) {
                    registerRaf(requestAnimationFrame(fadeBlue));
                    return { ...anim, blueLineOpacity: Math.max(0, anim.blueLineOpacity - 0.04) };
                  }
                  // After blue line fades, fade red lines and node highlights
                  registerTimer(setTimeout(() => {
                    const fadeRed = () => {
                      setStep5Anim(anim => {
                        if (anim.redLineOpacity > 0 || anim.redNodeOpacity > 0) {
                          registerRaf(requestAnimationFrame(fadeRed));
                          return {
                            ...anim,
                            redLineOpacity: Math.max(0, anim.redLineOpacity - 0.04),
                            redNodeOpacity: Math.max(0, anim.redNodeOpacity - 0.04),
                          };
                        }
                        return anim;
                      });
                    };
                    fadeRed();
                    // After lines/highlights fade, animate attacker and SOC scale
                    registerTimer(setTimeout(() => {
                      // Grow attacker and SOC for 0.5s
                      let growStart = Date.now();
                      const grow = () => {
                        const elapsed = (Date.now() - growStart) / 500; // 0 to 1 over 0.5s
                        if (elapsed < 1) {
                          setStep5Anim(anim => ({ ...anim, attackerScale: 1 + 0.5 * elapsed, socScale: 1 + 0.5 * elapsed }));
                          registerRaf(requestAnimationFrame(grow));
                        } else {
                          setStep5Anim(anim => ({ ...anim, attackerScale: 1.5, socScale: 1.5 }));
                          // Shrink attacker and SOC for 1s
                          let shrinkStart = Date.now();
                          const shrink = () => {
                            const elapsedShrink = (Date.now() - shrinkStart) / 1000; // 0 to 1 over 1s
                            if (elapsedShrink < 1) {
                              setStep5Anim(anim => ({ ...anim, attackerScale: 1.5 - 1.5 * elapsedShrink, socScale: 1.5 - 1.5 * elapsedShrink }));
                              registerRaf(requestAnimationFrame(shrink));
                            } else {
                              setStep5Anim(anim => ({ ...anim, attackerScale: 0, attackerOpacity: 0, socScale: 0, socOpacity: 0 }));
                              // Fade out webapp blue glow
                              const fadeWebappGlow = () => {
                                setStep5Anim(anim => {
                                  if (anim.webappBlueGlowOpacity > 0) {
                                    registerRaf(requestAnimationFrame(fadeWebappGlow));
                                    return { ...anim, webappBlueGlowOpacity: Math.max(0, anim.webappBlueGlowOpacity - 0.04) };
                                  }
                                  return anim;
                                });
                              };
                              fadeWebappGlow();
                            }
                          };
                          shrink();
                        }
                      };
                      grow();
                    }, 1200)); // Start scale after lines/highlights fade + 1s
                  }, 200)); // Short pause after blue line fade
                  return anim;
                });
              };
              fadeBlue();
            }, 2000));
            return { ...anim, blueLineProgress: 1 };
          });
        };
        animate();
      }, 300)); // Start blue line animation after 0.3s
    }
    // ...existing code for other steps...
    return cleanupAnimations;
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
            {/* Main node rendering loop (exclude attacker in step 5 fade-out only after fade) */}
            {infraNodes.map(node => {
              // Only exclude attacker node in step 5 if it is fully faded out
              if (node.key === 'attacker' && step === 5 && step5Anim.attackerOpacity === 0) return null;
              const isDb = node.key === 'db';
              return (
                <g key={node.key}>
                  {/* Only render db highlight in step 3, 4, or 5 while fading */}
                  {(isDb && ((step === 3 || step === 4) || (step === 5 && step5Anim.redNodeOpacity > 0.01))) && (
                    <circle cx={node.x} cy={node.y} r={38} fill="#e74c3c" opacity={0.18 * (step === 5 ? step5Anim.redNodeOpacity : 1)} />
                  )}
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
              );
            })}
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
            {(step >= 1 && step !== 6) && (
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
                  : (step > 1 && step < 5 && <line x1={60} y1={120} x2={200} y2={60} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" />)
                )}
                {/* Dashed red line (growing in step 2, static after) from attacker to webapp without arrow */}
                {step === 1 && cveLineProgress === 1 && webappLineProgress > 0 && (
                  <AnimatedLine x1={60} y1={120} x2={300} y2={120} progress={webappLineProgress} stroke="#e74c3c" strokeWidth={4} dashArray="8 6" />
                )}
                {(step > 1 && step < 5) && (
                  <line x1={60} y1={120} x2={300} y2={120} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" />
                )}
                {/* Dashed red line (growing in step 2, static after) from webapp to third party */}
                {(step === 1
                  ? (webappLineProgress === 1 && <AnimatedLine x1={300} y1={120} x2={300} y2={220} progress={1} stroke="#e74c3c" strokeWidth={4} dashArray="8 6" />)
                  : (step > 1 && step < 5 && <line x1={300} y1={120} x2={300} y2={220} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" />)
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
                {['webapp','waf','server','cloud'].map(key => compromisedNodes.includes(key) && (
                  <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                ))}
                {/* Database highlight: only in step 2 if compromised */}
                {compromisedNodes.includes('db') && (
                  <circle cx={860} cy={120} r={38} fill="#e74c3c" opacity={0.18} />
                )}
              </g>
            )}
            {/* Step 4: SOC node, alert line, dev node, fix line */}
            {/* (removed: all references to showSOC, socAlertProgress, showDev, devFixProgress, and their lines/nodes) */}
            {/* Step 4: show db node as safe (green highlight) */}
            {step === 4 && (
              <circle cx={860} cy={120} r={38} fill="#e74c3c" opacity={0.18} />
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
                    // New: webapp to third party
                    { from: [300, 120], to: [300, 220] },
                  ];
                  // In step 3, animate as before. In step 4, always show all segments.
                  if (step === 3 || (step === 2 && compromisedNodes.length === 5)) {
                    return [
                      ...segs.map((seg, i) => (
                        <line key={i} x1={seg.from[0]} y1={seg.from[1]} x2={seg.to[0]} y2={seg.to[1]} stroke="#e74c3c" strokeWidth={4} />
                      )),
                      // Always show webapp→third party in step 3/4
                      <line key="webapp-3p" x1={300} y1={120} x2={300} y2={220} stroke="#e74c3c" strokeWidth={4} />
                    ];
                  }
                  // Incomplete step 3: show animated segments
                  let lines = [];
                  for (let i = 0; i < attackSegment - 1; ++i) {
                    lines.push(
                      <line key={i} x1={segs[i].from[0]} y1={segs[i].from[1]} x2={segs[i].to[0]} y2={segs[i].to[1]} stroke="#e74c3c" strokeWidth={4} />
                    );
                    // If drawing webapp→waf, also draw webapp→third party
                    if (i === 1) {
                      lines.push(
                        <line key="webapp-3p-static" x1={300} y1={120} x2={300} y2={220} stroke="#e74c3c" strokeWidth={4} />
                      );
                    }
                  }
                  if (attackSegment > 0 && attackSegment <= segs.length) {
                    const seg = segs[attackSegment - 1];
                    lines.push(
                      <AnimatedLine key={"anim-"+attackSegment} x1={seg.from[0]} y1={seg.from[1]} x2={seg.to[0]} y2={seg.to[1]} progress={attackProgress} stroke="#e74c3c" strokeWidth={4} />
                    );
                    // If animating webapp→waf, also animate webapp→third party
                    if (attackSegment === 2) {
                      lines.push(
                        <AnimatedLine key="anim-webapp-3p" x1={300} y1={120} x2={300} y2={220} progress={attackProgress} stroke="#e74c3c" strokeWidth={4} />
                      );
                    }
                  }
                  return lines;
                })()}
                {/* Compromised state: highlight all nodes after line reaches db or in step 4 */}
                {['webapp','waf','server','cloud','thirdparty','db'].map(key => {
                  // For step 2 (step===2), highlight thirdparty only if attackSegment > 2 (after webapp->thirdparty animates)
                  if (key === 'thirdparty' && step === 2) {
                    if (attackSegment > 2 || compromisedNodes.includes('thirdparty')) {
                      return (
                        <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                      );
                    }
                    return null;
                  }
                  // For webapp, highlight only after attackSegment > 0 (attack reached webapp)
                  if (key === 'webapp' && step === 2) {
                    if (attackSegment > 0 || compromisedNodes.includes('webapp')) {
                      return (
                        <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                      );
                    }
                    return null;
                  }
                  // For waf, highlight after attackSegment > 1
                  if (key === 'waf' && step === 2) {
                    if (attackSegment > 1 || compromisedNodes.includes('waf')) {
                      return (
                        <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                      );
                    }
                    return null;
                  }
                  // For server, highlight after attackSegment > 2
                  if (key === 'server' && step === 2) {
                    if (attackSegment > 2 || compromisedNodes.includes('server')) {
                      return (
                        <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                      );
                    }
                    return null;
                  }
                  // For cloud, highlight after attackSegment > 3
                  if (key === 'cloud' && step === 2) {
                    if (attackSegment > 3 || compromisedNodes.includes('cloud')) {
                      return (
                        <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                      );
                    }
                    return null;
                  }
                  // For db, highlight after attackSegment > 4
                  if (key === 'db' && step === 2) {
                    if (attackSegment > 4 || compromisedNodes.includes('db')) {
                      return (
                        <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                      );
                    }
                    return null;
                  }
                  // For all other nodes, highlight as before
                  if ((compromisedNodes.includes(key) || step === 3)) {
                    return (
                      <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18} />
                    );
                  }
                  return null;
                })}
              </g>
            )}
            {/* Step 4: sensor lights up, analyst appears, blue line animates */}
            {step === 3 && (
              <g>
                {/* Webapp pulse or light up (always visible in step 4) */}
                <circle cx={300} cy={120} r={38} fill="#00e6c3" opacity={0.25} className="ctg-pulse" />
                {/* SOC/Security Analyst user object removed */}
              </g>
            )}
            {/* Step 4: webapp lit, SOC/analyst appears with pop-in and glow, then blue line */}
            {(step === 4 || step === 5) && (
              <g>
                {/* Brighter webapp sensor highlight (match step 5 style) */}
                <circle cx={300} cy={120} r={44} fill="#00fff0" opacity={0.45} style={{ filter: 'blur(2.5px)' }} />
                {/* Webapp node (match step 5 style) with glow animation */}
                <g style={{
                  filter: webappGlow ? 'drop-shadow(0 0 16px #00e6c3)' : 'none',
                  transition: 'filter 0.7s',
                }}>
                  <circle cx={300} cy={120} r={32} fill={'#23293a'} stroke={'#888'} strokeWidth={2} />
                  <text x={300} y={130} textAnchor="middle" fontSize={28} fill="#fff">🖥️</text>
                  <text x={300} y={168} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>Web Application</text>
                  {/* Overlay the Contrast sensor image on the web application (match step 5 style) */}
                  <image
                    href={contrastSensorImg}
                    x={300 - 18}
                    y={120 - 50}
                    width={36}
                    height={36}
                    style={{ pointerEvents: 'none' }}
                  />
                </g>
                {/* SOC Analyst node, aligned vertically with attacker, in a row below, fade in only in step 4; always visible in step 5 */}
                <g style={{
                  opacity: step === 4 ? (socPopIn ? 1 : 0) : 1,
                  filter: socPopIn ? 'drop-shadow(0 0 16px #00e6c3)' : 'none',
                  transition: step === 4 ? 'opacity 0.7s, filter 0.7s' : undefined,
                }}>
                  <circle cx={60} cy={220} r={32} fill="#23293a" stroke="#00e6c3" strokeWidth={2} />
                  <text x={60} y={230} textAnchor="middle" fontSize={28} fill="#fff">🧑‍💼</text>
                  <text x={60} y={268} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>SOC Analyst</text>
                  <circle cx={60} cy={220} r={38} fill="#00e6c3" opacity={0.25} />
                </g>
                {/* Dotted blue line: step 4 (webapp→SOC), step 5 (SOC→webapp) */}
                {step === 4 && showBlueLine && (
                  <AnimatedLine x1={300} y1={120} x2={60} y2={220} progress={blueLineProgress} stroke="#00e6c3" strokeWidth={4} dashArray="8 6" opacity={blueLineOpacity} />
                )}
                {step === 5 && step5Anim.showBlueLine && (
                  <AnimatedLine x1={60} y1={220} x2={300} y2={120} progress={step5Anim.blueLineProgress} stroke="#00e6c3" strokeWidth={4} dashArray="8 6" opacity={step5Anim.blueLineOpacity} />
                )}
                {/* Red highlight on compromised nodes and attack line from webapp to db */}
                <line x1={60} y1={120} x2={300} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step === 5 ? step5Anim.redLineOpacity : 1} />
                <line x1={300} y1={120} x2={440} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step === 5 ? step5Anim.redLineOpacity : 1} />
                <line x1={440} y1={120} x2={580} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step === 5 ? step5Anim.redLineOpacity : 1} />
                <line x1={580} y1={120} x2={720} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step === 5 ? step5Anim.redLineOpacity : 1} />
                <line x1={720} y1={120} x2={860} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step === 5 ? step5Anim.redLineOpacity : 1} />
                {/* Only fade node highlights for waf, server, cloud, db in step 5, then remove highlight entirely */}
                {step === 4 && (
                  <>
                    <circle cx={440} cy={120} r={38} fill="#e74c3c" opacity={0.18} />
                    <circle cx={580} cy={120} r={38} fill="#e74c3c" opacity={0.18} />
                    <circle cx={720} cy={120} r={38} fill="#e74c3c" opacity={0.18} />
                    <circle cx={860} cy={120} r={38} fill="#e74c3c" opacity={0.18} />
                  </>
                )}
                {step === 5 && step5Anim.redNodeOpacity > 0.01 && (
                  <circle cx={860} cy={120} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                )}
                {/* Webapp highlight does not fade */}
                <circle cx={300} cy={120} r={38} fill="#e74c3c" opacity={0.18} />
              </g>
            )}
            {/* Step 5: keep red highlight/attack line, SOC/analyst removed */}
            {step === 5 && (
              <g>
                {/* Red node highlights for waf, server, cloud, db (fade out), and webapp (does not fade) */}
                {['waf','server','cloud','db'].map(key => (
                  step5Anim.redNodeOpacity > 0.01 && (
                    <circle key={key} cx={infraNodes.find(n=>n.key===key)!.x} cy={infraNodes.find(n=>n.key===key)!.y} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                  )
                ))}
                {/* Webapp highlight does not fade */}
                <circle cx={300} cy={120} r={38} fill="#e74c3c" opacity={0.18} />
                {/* Third party highlight (always on in step 5) */}
                <circle cx={300} cy={220} r={38} fill="#e74c3c" opacity={0.18} />
              </g>
            )}
            {/* Step 6: red lines and highlights fade out after a pause */}
            {step === 6 && (
              <g>
                {/* Red attack lines (fade out) */}
                {/* Attacker to CVE (dashed) - use redLineOpacity * attackerOpacity for sync fade */}
                <line x1={60} y1={120} x2={200} y2={60} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" opacity={step5Anim.redLineOpacity * step5Anim.attackerOpacity} />
                {/* Attacker to WebApp (dashed) */}
                <line x1={60} y1={120} x2={300} y2={120} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" opacity={step5Anim.redLineOpacity * step5Anim.attackerOpacity} />
                {/* WebApp to Third Party (dashed) */}
                <line x1={300} y1={120} x2={300} y2={220} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" opacity={step5Anim.redLineOpacity} />
                {/* WebApp to WAF, WAF to Server, Server to Cloud, Cloud to DB */}
                <line x1={300} y1={120} x2={440} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step5Anim.redLineOpacity} />
                <line x1={440} y1={120} x2={580} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step5Anim.redLineOpacity} />
                <line x1={580} y1={120} x2={720} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step5Anim.redLineOpacity} />
                <line x1={720} y1={120} x2={860} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step5Anim.redLineOpacity} />
                {/* Red node highlights (fade out) */}
                <circle cx={440} cy={120} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                <circle cx={580} cy={120} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                <circle cx={720} cy={120} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                <circle cx={860} cy={120} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                {/* Attacker node fades out after lines */}
                <g style={{ opacity: step5Anim.attackerOpacity, transition: 'opacity 0.5s' }}>
                  <circle cx={60} cy={120} r={32} fill={'#23293a'} stroke={'#888'} strokeWidth={2} />
                  <text x={60} y={130} textAnchor="middle" fontSize={28} fill="#fff">🕵️‍♂️</text>
                  <text x={60} y={168} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>Attacker</text>
                </g>
              </g>
            )}
            {/* Step 5: attacker, SOC, and attack lines fade/scale out after a pause (rendered last for top stacking) */}
            {step === 5 && (
              <g style={{ pointerEvents: 'none' }}>
                {/* Red attack lines (fade out) */}
                {/* Attacker to CVE (dashed) - use redLineOpacity * attackerOpacity for sync fade */}
                <line x1={60} y1={120} x2={200} y2={60} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" opacity={step5Anim.redLineOpacity * step5Anim.attackerOpacity} />
                {/* Attacker to WebApp (dashed) */}
                <line x1={60} y1={120} x2={300} y2={120} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" opacity={step5Anim.redLineOpacity * step5Anim.attackerOpacity} />
                {/* WebApp to Third Party (dashed) */}
                <line x1={300} y1={120} x2={300} y2={220} stroke="#e74c3c" strokeWidth={4} strokeDasharray="8 6" opacity={step5Anim.redLineOpacity} />
                {/* WebApp to WAF, WAF to Server, Server to Cloud, Cloud to DB */}
                <line x1={300} y1={120} x2={440} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step5Anim.redLineOpacity} />
                <line x1={440} y1={120} x2={580} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step5Anim.redLineOpacity} />
                <line x1={580} y1={120} x2={720} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step5Anim.redLineOpacity} />
                <line x1={720} y1={120} x2={860} y2={120} stroke="#e74c3c" strokeWidth={4} opacity={step5Anim.redLineOpacity} />
                {/* Red node highlights (fade out) */}
                <circle cx={440} cy={120} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                <circle cx={580} cy={120} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                <circle cx={720} cy={120} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                <circle cx={860} cy={120} r={38} fill="#e74c3c" opacity={0.18 * step5Anim.redNodeOpacity} />
                {/* Attacker node fades and scales out after lines */}
                {step5Anim.attackerOpacity > 0 && (
                  <g style={{ opacity: step5Anim.attackerOpacity, transition: 'opacity 0.5s', transform: `scale(${step5Anim.attackerScale})`, transformOrigin: '60px 120px' }}>
                    <circle cx={60} cy={120} r={32} fill={'#23293a'} stroke={'#888'} strokeWidth={2} />
                    <text x={60} y={130} textAnchor="middle" fontSize={28} fill="#fff">🕵️‍♂️</text>
                    <text x={60} y={168} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>Attacker</text>
                  </g>
                )}
                {/* SOC Analyst node fades and scales out after lines */}
                {step5Anim.socOpacity > 0 && (
                  <g style={{ opacity: step5Anim.socOpacity, transition: 'opacity 0.5s', transform: `scale(${step5Anim.socScale})`, transformOrigin: '60px 220px' }}>
                    <circle cx={60} cy={220} r={32} fill="#23293a" stroke="#00e6c3" strokeWidth={2} />
                    <text x={60} y={230} textAnchor="middle" fontSize={28} fill="#fff">🧑‍💼</text>
                    <text x={60} y={268} textAnchor="middle" fontSize={13} fill="#00e6c3" fontWeight={500}>SOC Analyst</text>
                    <circle cx={60} cy={220} r={38} fill="#00e6c3" opacity={0.25} />
                  </g>
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
