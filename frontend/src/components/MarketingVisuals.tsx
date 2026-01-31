import { Shield, Zap, Database, User, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export function ArchitectureDiagram() {
    return (
        <div style={{ width: '100%', maxWidth: '900px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
            <style>
                {`
                @keyframes flow {
                    0% { stroke-dashoffset: 20; }
                    100% { stroke-dashoffset: 0; }
                }
                @keyframes pulse-node {
                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 0px rgba(0,0,0,0)); }
                    50% { transform: scale(1.02); filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
                }
                .flow-line {
                    stroke-dasharray: 10;
                    animation: flow 1s linear infinite;
                }
                `}
            </style>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem',
                alignItems: 'center',
                justifyItems: 'center',
                position: 'relative'
            }}>
                {/* Step 1: User / Input */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                    <div style={{
                        width: '80px', height: '80px',
                        background: '#eff6ff', border: '2px solid #3b82f6',
                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#3b82f6', marginBottom: '1rem'
                    }}>
                        <User size={40} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e3a8a' }}>Blind Input</h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem' }}>Encrypted locally<br />Sent over secure RPC</p>
                </div>

                {/* Arrow */}
                <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center' }} className="hidden md-block">
                    <ArrowRight size={32} />
                </div>

                {/* Step 2: TEE / PER */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                    <div style={{
                        width: '100px', height: '100px',
                        background: '#f0fdf4', border: '2px solid #22c55e',
                        borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#22c55e', marginBottom: '1rem',
                        position: 'relative',
                        boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.2)'
                    }}>
                        <Shield size={50} />
                        <div style={{
                            position: 'absolute', top: -10, right: -10,
                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '50%', padding: '6px',
                            color: '#eab308'
                        }}>
                            <Zap size={20} fill="#eab308" />
                        </div>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#064e3b' }}>TEE + Rollup</h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem' }}>Decrypted in Enclave<br />Processed off-chain</p>
                </div>

                {/* Arrow */}
                <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center' }} className="hidden md-block">
                    <ArrowRight size={32} />
                </div>

                {/* Step 3: Solana */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
                    <div style={{
                        width: '80px', height: '80px',
                        background: '#f5f3ff', border: '2px solid #8b5cf6',
                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#8b5cf6', marginBottom: '1rem'
                    }}>
                        <Database size={40} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#4c1d95' }}>Solana L1</h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', textAlign: 'center', marginTop: '0.5rem' }}>Result Settlement<br />Immutable Record</p>
                </div>
            </div>
        </div>
    );
}

export function ProblemSolutionVisual() {
    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            fontFamily: 'Inter, sans-serif'
        }}>
            {/* Problem Card */}
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #fecaca',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#ef4444' }}></div>
                <h3 style={{ color: '#991b1b', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <XCircle size={24} /> The Problem
                </h3>
                <p style={{ color: '#7f1d1d', fontWeight: 500, marginBottom: '2rem' }}>Information Asymmetry</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', opacity: 0.5 }}>
                    <div style={{ textAlign: 'center' }}>
                        <User size={40} color="#64748b" />
                        <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', marginTop: '4px', fontSize: '0.8rem' }}>Alice</div>
                    </div>
                    <div style={{ height: '60px', width: '2px', background: '#cbd5e1' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <User size={40} color="#64748b" />
                        <div style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', marginTop: '4px', fontSize: '0.8rem' }}>Bob</div>
                    </div>
                </div>

                <div style={{ background: '#fef2f2', padding: '1rem', borderRadius: '8px', border: '1px dashed #fca5a5', color: '#b91c1c', fontSize: '0.9rem' }}>
                    "I can't say my number first because I'll lose leverage."
                </div>
            </div>

            {/* Solution Card */}
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                border: '1px solid #bbf7d0',
                padding: '2rem',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: '#10b981' }}></div>
                <h3 style={{ color: '#065f46', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={24} /> The Solution
                </h3>
                <p style={{ color: '#064e3b', fontWeight: 500, marginBottom: '2rem' }}>Double-Blind Matching</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ textAlign: 'center' }}>
                        <User size={40} color="#0f172a" />
                        <div style={{ background: '#eff6ff', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', marginTop: '4px', fontSize: '0.8rem' }}>$120k</div>
                    </div>

                    <div style={{ position: 'relative' }}>
                        <div style={{ width: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={40} color="#10b981" fill="#ecfdf5" style={{ filter: 'drop-shadow(0 4px 6px rgba(16, 185, 129, 0.2))' }} />
                        </div>
                        <div style={{ position: 'absolute', top: '50%', left: '-40px', width: '40px', height: '2px', background: '#cbd5e1', zIndex: -1 }}></div>
                        <div style={{ position: 'absolute', top: '50%', right: '-40px', width: '40px', height: '2px', background: '#cbd5e1', zIndex: -1 }}></div>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <User size={40} color="#0f172a" />
                        <div style={{ background: '#eff6ff', color: '#1e40af', padding: '4px 8px', borderRadius: '4px', marginTop: '4px', fontSize: '0.8rem' }}>$115k</div>
                    </div>
                </div>

                <div style={{ background: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #86efac', color: '#15803d', fontSize: '0.9rem', textAlign: 'center', fontWeight: 600 }}>
                    Match Found! ✅
                </div>
            </div>
        </div>
    );
}
