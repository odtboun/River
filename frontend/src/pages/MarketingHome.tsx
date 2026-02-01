import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export function MarketingHome() {
    const [showNav, setShowNav] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setShowNav(window.scrollY > 600);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="marketing-home" style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            color: '#111827',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}>
            {/* Navigation */}
            <nav className="nav" style={{
                position: 'fixed',
                top: 0, left: 0, right: 0,
                transform: showNav ? 'translateY(0)' : 'translateY(-100%)',
                transition: 'transform 0.3s ease-in-out',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%',
                borderBottom: '1px solid #f3f4f6',
                zIndex: 50,
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(8px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/river.svg" alt="River" style={{ width: '30px', height: '30px' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.025em', color: '#111827' }}>River</span>
                </div>

                <Link
                    to="/app"
                    className="btn"
                    style={{
                        background: '#18181b', // Zinc-900
                        color: '#fff',
                        fontWeight: 500,
                        padding: '0.625rem 1.25rem',
                        borderRadius: '8px',
                        fontSize: '0.9375rem',
                        textDecoration: 'none',
                        transition: 'background 0.2s',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                >
                    Launch App
                </Link>
            </nav>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <section style={{
                    position: 'relative',
                    overflow: 'hidden',
                    minHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                }}>
                    {/* Background Image */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        backgroundImage: 'url(/abstract-river.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 0
                    }} />

                    {/* Overlay for Readability */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.85) 60%, #ffffff 100%)',
                        zIndex: 1
                    }} />

                    <div style={{
                        position: 'relative',
                        zIndex: 10,
                        padding: '6rem 1.5rem',
                        textAlign: 'center',
                        maxWidth: '900px',
                        margin: '0 auto'
                    }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.375rem 1rem',
                            background: 'rgba(243, 244, 246, 0.8)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: '9999px',
                            fontSize: '0.875rem',
                            color: '#4b5563',
                            fontWeight: 500,
                            marginBottom: '2rem',
                            border: '1px solid rgba(255,255,255,0.5)'
                        }}>
                            <span style={{ width: '6px', height: '6px', backgroundColor: '#10b981', borderRadius: '50%' }}></span>
                            Live on Solana Devnet
                        </div>

                        <h1 style={{
                            fontSize: 'clamp(3rem, 6vw, 4.5rem)',
                            fontWeight: 800,
                            lineHeight: 1.1,
                            letterSpacing: '-0.03em',
                            color: '#111827',
                            marginBottom: '1.5rem',
                            textShadow: '0 2px 10px rgba(255,255,255,0.5)'
                        }}>
                            Salary Negotiation.<br />
                            <span style={{ color: '#059669' }}>Double-Blind. Private.</span>
                        </h1>

                        <p style={{
                            fontSize: '1.25rem',
                            color: '#4b5563',
                            maxWidth: '580px',
                            margin: '0 auto 3rem',
                            lineHeight: 1.6
                        }}>
                            Discover if your expectations match without ever revealing your number.
                            Powered by Intel TDX Trusted Execution Environments.
                        </p>

                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <Link
                                to="/app"
                                style={{
                                    background: '#18181b',
                                    color: '#fff',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    fontSize: '1.0625rem',
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                Start Negotiation
                            </Link>
                            <a
                                href="https://github.com/odtboun/River"
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    background: 'rgba(255,255,255,0.8)',
                                    color: '#111827',
                                    padding: '1rem 2rem',
                                    borderRadius: '8px',
                                    fontSize: '1.0625rem',
                                    fontWeight: 500,
                                    textDecoration: 'none',
                                    border: '1px solid #e5e7eb',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    backdropFilter: 'blur(4px)'
                                }}
                            >
                                View Source
                            </a>
                        </div>
                    </div>
                </section>

                {/* Problem / Solution Grid */}
                <section style={{ background: '#ffffff', padding: '6rem 1.5rem', position: 'relative', zIndex: 10 }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '4rem' }}>
                        <div>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#dc2626', marginBottom: '1rem' }}>The Problem</h3>
                            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.025em' }}>Information Asymmetry</h2>
                            <p style={{ color: '#4b5563', lineHeight: 1.6 }}>
                                In traditional negotiation, the first person to say a number often loses leverage.
                                Employers know their budget limits, while candidates know their minimums—but neither side wants to reveal their hand, leading to inefficiency and mistrust.
                            </p>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', marginBottom: '1rem' }}>The Solution</h3>
                            <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.025em' }}>Double-Blind Matching</h2>
                            <p style={{ color: '#4b5563', lineHeight: 1.6 }}>
                                River acts as a neutral, cryptographic third party. Both sides submit their numbers privately.
                                Our secure enclave compares them and only reveals a "Match" or "No Match" result.
                                If there's no match, neither side learns the other's number.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Architecture & Tech */}
                <section style={{ padding: '6rem 1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%', background: '#fff', position: 'relative', zIndex: 10 }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.025em' }}>How It Works</h2>
                        <p style={{ color: '#6b7280', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
                            Hardware-grade privacy on the Solana blockchain.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        <div style={{ padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Intel TDX Enclaves</h3>
                            <p style={{ color: '#4b5563', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                                Computation happens inside a hardware-isolated Trusted Execution Environment (TEE).
                                The memory is encrypted at the CPU level, ensuring raw data is invisible even to the server operator.
                            </p>
                        </div>

                        <div style={{ padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚀</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>MagicBlock PER</h3>
                            <p style={{ color: '#4b5563', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                                Utilizing Private Ephemeral Rollups allows us to perform high-speed,
                                gas-free negotiation steps off-chain while maintaining cryptographic integrity.
                            </p>
                        </div>

                        <div style={{ padding: '2rem', borderRadius: '12px', border: '1px solid #e5e7eb', background: '#fff' }}>
                            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚓️</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Solana Settlement</h3>
                            <p style={{ color: '#4b5563', fontSize: '0.9375rem', lineHeight: 1.6 }}>
                                Once the negotiation concludes, only the final boolean result (Match/No Match)
                                is committed back to the Solana mainnet for permanent, verifiable record-keeping.
                            </p>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: '#9ca3af',
                fontSize: '0.875rem',
                borderTop: '1px solid #f3f4f6',
                marginTop: 'auto',
                background: '#fff',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                    <a href="https://magicblock.gg" target="_blank" rel="noreferrer" style={{ color: '#4b5563', textDecoration: 'none' }}>MagicBlock</a>
                    <a href="https://solana.com" target="_blank" rel="noreferrer" style={{ color: '#4b5563', textDecoration: 'none' }}>Solana</a>
                    <a href="https://github.com/odtboun/River" target="_blank" rel="noreferrer" style={{ color: '#4b5563', textDecoration: 'none' }}>GitHub</a>
                </div>
                <p>&copy; 2026 River Protocol. All rights reserved.</p>
            </footer>
        </div>
    );
}
