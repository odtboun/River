import { Link } from 'react-router-dom';
import { ArchitectureDiagram, ProblemSolutionVisual } from '../components/MarketingVisuals';

export function MarketingHome() {
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
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%',
                borderBottom: '1px solid #f3f4f6',
                position: 'relative',
                zIndex: 20,
                background: 'rgba(255,255,255,0.8)',
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
                <section style={{ position: 'relative', overflow: 'hidden' }}>
                    {/* Background Image */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        backgroundImage: 'url(/hero-bg.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 0
                    }} />

                    {/* Overlay for Readability */}
                    <div style={{
                        position: 'absolute',
                        top: 0, left: 0, width: '100%', height: '100%',
                        background: 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.75) 40%, rgba(255,255,255,1))',
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
                            <span style={{ color: '#6b7280' }}>Double-Blind. Private.</span>
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

                {/* Problem / Solution Visuals */}
                <section style={{ background: '#f9fafb', padding: '6rem 1.5rem', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', position: 'relative', zIndex: 10 }}>
                    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                        <ProblemSolutionVisual />
                    </div>
                </section>

                {/* Architecture Visuals */}
                <section style={{ padding: '6rem 1.5rem', maxWidth: '1000px', margin: '0 auto', width: '100%', background: '#fff', position: 'relative', zIndex: 10 }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem', letterSpacing: '-0.025em' }}>How It Works</h2>
                        <p style={{ color: '#6b7280', fontSize: '1.125rem', maxWidth: '600px', margin: '0 auto' }}>
                            Hardware-grade privacy on the Solana blockchain.
                        </p>
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <ArchitectureDiagram />
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
