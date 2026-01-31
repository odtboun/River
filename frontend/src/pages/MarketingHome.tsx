import { Link } from 'react-router-dom';

export function MarketingHome() {
    return (
        <div className="marketing-home" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a', color: '#fff' }}>
            {/* Navigation */}
            <nav className="nav" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem 2rem',
                maxWidth: '1200px',
                margin: '0 auto',
                width: '100%'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img src="/river.svg" alt="River" style={{ width: '32px', height: '32px' }} />
                    <span style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.025em' }}>River</span>
                </div>

                <Link
                    to="/app"
                    className="btn"
                    style={{
                        background: '#fff',
                        color: '#0a0a0a',
                        fontWeight: 500,
                        padding: '0.625rem 1.25rem',
                        borderRadius: '6px',
                        fontSize: '0.9375rem',
                        textDecoration: 'none',
                        border: '1px solid #fff',
                        transition: 'opacity 0.2s'
                    }}
                >
                    Launch App
                </Link>
            </nav>

            {/* Hero Section */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 1.5rem' }}>
                <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '4rem 0' }}>
                    <div style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        background: 'rgba(255,255,255,0.08)',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        marginBottom: '1.5rem',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        Now live on Solana Devnet
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                        fontWeight: 700,
                        lineHeight: 1.1,
                        letterSpacing: '-0.04em', // Tighter tracking for "classy" look
                        marginBottom: '1.5rem'
                    }}>
                        Salary Negotiation.<br />
                        <span style={{ color: '#888' }}>Double-Blind. Private.</span>
                    </h1>

                    <p style={{
                        fontSize: '1.25rem',
                        color: '#a1a1aa',
                        maxWidth: '540px',
                        margin: '0 auto 3rem',
                        lineHeight: 1.6
                    }}>
                        Reach an agreement without ever compromising your position.
                        Powered by high-performance Trusted Execution Environments (TEE).
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link
                            to="/app"
                            style={{
                                background: '#fff',
                                color: '#0a0a0a',
                                padding: '1rem 2rem',
                                borderRadius: '8px',
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                textDecoration: 'none',
                                border: '1px solid #fff'
                            }}
                        >
                            Start Negotiation
                        </Link>
                        <a
                            href="https://github.com/odtboun/River"
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                background: 'transparent',
                                color: '#fff',
                                padding: '1rem 2rem',
                                borderRadius: '8px',
                                fontSize: '1.125rem',
                                fontWeight: 500,
                                textDecoration: 'none',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}
                        >
                            View Source
                        </a>
                    </div>
                </div>

                {/* Feature Grid */}
                <div style={{
                    maxWidth: '1200px',
                    margin: '4rem auto 0',
                    width: '100%',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2rem',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    paddingTop: '4rem'
                }}>
                    <div>
                        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔒</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Confidential Computing</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
                            Your data is processed inside Intel TDX enclaves. Not even the node operators can see your numbers.
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚖️</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Double-Blind</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
                            Employers set a max budget. Candidates set a minimum. We only reveal if you match.
                        </p>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚡️</div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>MagicBlock PER</h3>
                        <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>
                            Built on Private Ephemeral Rollups for instant settlement and zero gas fees for negotiation steps.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                color: '#52525b',
                fontSize: '0.875rem',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                marginTop: 'auto'
            }}>
                <p>&copy; 2026 River Protocol. Built on Solana.</p>
            </footer>
        </div>
    );
}
