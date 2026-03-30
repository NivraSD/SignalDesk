<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SignalDesk Strategic PR Setup</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
            color: #E2E8F0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .onboarding-container {
            background: #1F2937;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            max-width: 800px;
            width: 100%;
            overflow: hidden;
        }

        .progress-bar {
            height: 4px;
            background: #374151;
            position: relative;
        }

        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #6366F1, #8B5CF6);
            transition: width 0.5s ease;
        }

        .onboarding-header {
            padding: 40px;
            text-align: center;
            border-bottom: 1px solid #374151;
        }

        .step-indicator {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-bottom: 30px;
        }

        .step-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #374151;
            transition: all 0.3s ease;
        }

        .step-dot.active {
            background: #6366F1;
            transform: scale(1.2);
        }

        .step-dot.completed {
            background: #10B981;
        }

        h1 {
            font-size: 32px;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            color: #9CA3AF;
            font-size: 18px;
        }

        .onboarding-content {
            padding: 40px;
            min-height: 400px;
        }

        .step-content {
            display: none;
        }

        .step-content.active {
            display: block;
            animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .form-group {
            margin-bottom: 25px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #E2E8F0;
            font-weight: 500;
        }

        input, select, textarea {
            width: 100%;
            padding: 12px 16px;
            background: #374151;
            border: 1px solid #4B5563;
            border-radius: 8px;
            color: #E2E8F0;
            font-size: 16px;
            transition: all 0.3s ease;
        }

        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #6366F1;
            background: #1F2937;
        }

        textarea {
            resize: vertical;
            min-height: 100px;
        }

        .objective-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .objective-card {
            background: #374151;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid transparent;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .objective-card:hover {
            border-color: #6366F1;
            transform: translateY(-2px);
        }

        .objective-card.selected {
            border-color: #10B981;
            background: #374151;
        }

        .opportunity-type {
            background: #374151;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 15px;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .opportunity-type:hover {
            background: #4B5563;
        }

        .opportunity-type input[type="checkbox"] {
            width: auto;
            margin: 0;
        }

        .automation-slider {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: #374151;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
        }

        .slider {
            width: 60px;
            height: 30px;
            background: #4B5563;
            border-radius: 15px;
            position: relative;
            cursor: pointer;
            transition: background 0.3s ease;
        }

        .slider.active {
            background: #10B981;
        }

        .slider-dot {
            width: 24px;
            height: 24px;
            background: white;
            border-radius: 50%;
            position: absolute;
            top: 3px;
            left: 3px;
            transition: transform 0.3s ease;
        }

        .slider.active .slider-dot {
            transform: translateX(30px);
        }

        .mcp-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }

        .mcp-card {
            background: #374151;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            border: 2px solid transparent;
        }

        .mcp-card:hover {
            border-color: #6366F1;
            transform: translateY(-2px);
        }

        .mcp-card.active {
            border-color: #10B981;
            background: linear-gradient(135deg, #37415150, #10B98110);
        }

        .mcp-icon {
            font-size: 32px;
            margin-bottom: 10px;
        }

        .mcp-name {
            font-weight: 600;
            margin-bottom: 5px;
        }

        .mcp-description {
            font-size: 12px;
            color: #9CA3AF;
        }

        .button-group {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #374151;
        }

        .btn {
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
        }

        .btn-secondary {
            background: #374151;
            color: #E2E8F0;
        }

        .btn-secondary:hover {
            background: #4B5563;
        }

        .btn-primary {
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            color: white;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
        }

        .completion-screen {
            text-align: center;
            padding: 60px 40px;
        }

        .checkmark {
            width: 80px;
            height: 80px;
            margin: 0 auto 30px;
            background: linear-gradient(135deg, #10B981, #059669);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: scaleIn 0.5s ease;
        }

        @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 40px 0;
        }

        .stat-card {
            background: #374151;
            padding: 20px;
            border-radius: 12px;
        }

        .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #6366F1;
            margin-bottom: 5px;
        }

        .stat-label {
            color: #9CA3AF;
            font-size: 14px;
        }

        .cascade-option {
            background: #374151;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .cascade-option input[type="radio"] {
            width: auto;
            margin: 0;
        }

        .cascade-details {
            flex: 1;
        }

        .cascade-title {
            font-weight: 600;
            margin-bottom: 5px;
        }

        .cascade-description {
            font-size: 14px;
            color: #9CA3AF;
        }
    </style>

</head>
<body>
    <div class="onboarding-container">
        <div class="progress-bar">
            <div class="progress-fill" id="progressBar" style="width: 20%"></div>
        </div>

        <div class="onboarding-header">
            <div class="step-indicator">
                <div class="step-dot active" data-step="1"></div>
                <div class="step-dot" data-step="2"></div>
                <div class="step-dot" data-step="3"></div>
                <div class="step-dot" data-step="4"></div>
                <div class="step-dot" data-step="5"></div>
            </div>
            <h1 id="stepTitle">Configure Your PR Command Center</h1>
            <p class="subtitle" id="stepSubtitle">Let's set up your autonomous PR orchestration system</p>
        </div>

        <div class="onboarding-content">
            <!-- Step 1: Strategic Profile -->
            <div class="step-content active" id="step1">
                <div class="form-group">
                    <label>Organization Name</label>
                    <input type="text" id="orgName" placeholder="Enter your company name">
                </div>
                <div class="form-group">
                    <label>Industry & Position</label>
                    <select id="industry">
                        <option value="">Select your primary industry</option>
                        <option value="technology">Technology</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="finance">Financial Services</option>
                        <option value="retail">Retail & E-commerce</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="media">Media & Entertainment</option>
                        <option value="energy">Energy & Utilities</option>
                        <option value="nonprofit">Non-Profit</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Market Position</label>
                    <select id="marketPosition">
                        <option value="">How are you positioned?</option>
                        <option value="leader">Market Leader</option>
                        <option value="challenger">Challenger Brand</option>
                        <option value="disruptor">Industry Disruptor</option>
                        <option value="emerging">Emerging Player</option>
                        <option value="niche">Niche Specialist</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Key Differentiators (What makes you unique?)</label>
                    <textarea id="differentiators" placeholder="e.g., First AI-powered solution, 10x faster than competitors, patented technology..."></textarea>
                </div>
            </div>

            <!-- Step 2: Strategic PR Objectives -->
            <div class="step-content" id="step2">
                <p style="margin-bottom: 20px;">Select your primary PR objectives (choose up to 3 priorities):</p>
                <div class="objective-grid">
                    <div class="objective-card" data-objective="thought-leadership">
                        <div style="font-size: 24px; margin-bottom: 10px;">🎯</div>
                        <div style="font-weight: 600;">Thought Leadership</div>
                        <div style="font-size: 12px; color: #9CA3AF;">Position executives as industry experts</div>
                    </div>
                    <div class="objective-card" data-objective="product-launches">
                        <div style="font-size: 24px; margin-bottom: 10px;">🚀</div>
                        <div style="font-weight: 600;">Product Launches</div>
                        <div style="font-size: 12px; color: #9CA3AF;">Maximum impact for new offerings</div>
                    </div>
                    <div class="objective-card" data-objective="funding">
                        <div style="font-size: 24px; margin-bottom: 10px;">💰</div>
                        <div style="font-weight: 600;">Funding & Growth</div>
                        <div style="font-size: 12px; color: #9CA3AF;">Investor relations & funding news</div>
                    </div>
                    <div class="objective-card" data-objective="talent">
                        <div style="font-size: 24px; margin-bottom: 10px;">👥</div>
                        <div style="font-weight: 600;">Talent Acquisition</div>
                        <div style="font-size: 12px; color: #9CA3AF;">Employer brand & recruitment</div>
                    </div>
                    <div class="objective-card" data-objective="crisis">
                        <div style="font-size: 24px; margin-bottom: 10px;">🛡️</div>
                        <div style="font-weight: 600;">Crisis Preparedness</div>
                        <div style="font-size: 12px; color: #9CA3AF;">Reputation protection & response</div>
                    </div>
                    <div class="objective-card" data-objective="competitive">
                        <div style="font-size: 24px; margin-bottom: 10px;">⚔️</div>
                        <div style="font-weight: 600;">Competitive Positioning</div>
                        <div style="font-size: 12px; color: #9CA3AF;">Win market share & mindshare</div>
                    </div>
                </div>
                <div class="form-group" style="margin-top: 30px;">
                    <label>Success Metrics (How will you measure PR success?)</label>
                    <textarea placeholder="e.g., Tier 1 media coverage monthly, 20% share of voice, 3 speaking opportunities per quarter..."></textarea>
                </div>
            </div>

            <!-- Step 3: Opportunity Configuration -->
            <div class="step-content" id="step3">
                <p style="margin-bottom: 20px;">Configure your opportunity discovery engine:</p>

                <div class="opportunity-type">
                    <input type="checkbox" id="competitorWeakness" checked>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">Competitor Weakness Detection</div>
                        <div style="font-size: 14px; color: #9CA3AF;">Automatically identify when competitors stumble (layoffs, crises, bad reviews)</div>
                    </div>
                </div>

                <div class="opportunity-type">
                    <input type="checkbox" id="narrativeVacuum" checked>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">Narrative Vacuum Opportunities</div>
                        <div style="font-size: 14px; color: #9CA3AF;">Find breaking news where you can provide expert commentary</div>
                    </div>
                </div>

                <div class="opportunity-type">
                    <input type="checkbox" id="cascadeEvents" checked>
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">Cascade Event Prediction</div>
                        <div style="font-size: 14px; color: #9CA3AF;">Predict 2nd and 3rd order effects of industry events</div>
                    </div>
                </div>

                <div class="opportunity-type">
                    <input type="checkbox" id="awardsSpeaking">
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">Awards & Speaking Opportunities</div>
                        <div style="font-size: 14px; color: #9CA3AF;">Track deadlines for awards, conferences, and panels</div>
                    </div>
                </div>

                <div class="opportunity-type">
                    <input type="checkbox" id="trendJacking">
                    <div style="flex: 1;">
                        <div style="font-weight: 600;">Trend Jacking</div>
                        <div style="font-size: 14px; color: #9CA3AF;">Identify trending topics where you have unique perspective</div>
                    </div>
                </div>

                <div class="form-group" style="margin-top: 30px;">
                    <label>Opportunity Response Time</label>
                    <select>
                        <option>Immediate (< 1 hour)</option>
                        <option>Rapid (< 4 hours)</option>
                        <option>Same Day</option>
                        <option>Next Day</option>
                    </select>
                </div>
            </div>

            <!-- Step 4: Campaign Orchestration -->
            <div class="step-content" id="step4">
                <p style="margin-bottom: 20px;">Set your campaign orchestration preferences:</p>

                <div class="automation-slider">
                    <div>
                        <div style="font-weight: 600;">Auto-Generate Campaign Plans</div>
                        <div style="font-size: 14px; color: #9CA3AF;">Niv creates full campaign strategies from opportunities</div>
                    </div>
                    <div class="slider active" onclick="toggleSlider(this)">
                        <div class="slider-dot"></div>
                    </div>
                </div>

                <div class="automation-slider">
                    <div>
                        <div style="font-weight: 600;">Content Auto-Creation</div>
                        <div style="font-size: 14px; color: #9CA3AF;">Generate press releases, pitches, and social content automatically</div>
                    </div>
                    <div class="slider active" onclick="toggleSlider(this)">
                        <div class="slider-dot"></div>
                    </div>
                </div>

                <div class="automation-slider">
                    <div>
                        <div style="font-weight: 600;">Smart Media Matching</div>
                        <div style="font-size: 14px; color: #9CA3AF;">AI matches opportunities to the right journalists</div>
                    </div>
                    <div class="slider" onclick="toggleSlider(this)">
                        <div class="slider-dot"></div>
                    </div>
                </div>

                <div class="automation-slider">
                    <div>
                        <div style="font-weight: 600;">Autonomous Execution</div>
                        <div style="font-size: 14px; color: #9CA3AF;">Execute approved campaigns without manual intervention</div>
                    </div>
                    <div class="slider" onclick="toggleSlider(this)">
                        <div class="slider-dot"></div>
                    </div>
                </div>

                <div style="margin-top: 30px;">
                    <label style="font-weight: 600; margin-bottom: 15px; display: block;">Cascade Intelligence Focus</label>
                    <div class="cascade-option">
                        <input type="radio" name="cascade" value="aggressive" id="cascadeAggressive">
                        <div class="cascade-details">
                            <div class="cascade-title">Aggressive Opportunist</div>
                            <div class="cascade-description">Actively exploit competitor weaknesses and market disruptions</div>
                        </div>
                    </div>
                    <div class="cascade-option">
                        <input type="radio" name="cascade" value="balanced" id="cascadeBalanced" checked>
                        <div class="cascade-details">
                            <div class="cascade-title">Balanced Strategic</div>
                            <div class="cascade-description">Mix of proactive campaigns and reactive opportunities</div>
                        </div>
                    </div>
                    <div class="cascade-option">
                        <input type="radio" name="cascade" value="defensive" id="cascadeDefensive">
                        <div class="cascade-details">
                            <div class="cascade-title">Defensive Positioning</div>
                            <div class="cascade-description">Focus on protecting reputation and managing risks</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Step 5: Intelligence Systems -->
            <div class="step-content" id="step5">
                <p style="margin-bottom: 20px;">Activate your PR intelligence systems:</p>

                <div class="mcp-grid">
                    <div class="mcp-card active" onclick="toggleMCP(this)">
                        <div class="mcp-icon">🧠</div>
                        <div class="mcp-name">Intelligence</div>
                        <div class="mcp-description">Market & competitor insights</div>
                    </div>
                    <div class="mcp-card active" onclick="toggleMCP(this)">
                        <div class="mcp-icon">🤝</div>
                        <div class="mcp-name">Relationships</div>
                        <div class="mcp-description">Stakeholder management</div>
                    </div>
                    <div class="mcp-card active" onclick="toggleMCP(this)">
                        <div class="mcp-icon">📊</div>
                        <div class="mcp-name">Analytics</div>
                        <div class="mcp-description">Performance & ROI</div>
                    </div>
                    <div class="mcp-card active" onclick="toggleMCP(this)">
                        <div class="mcp-icon">✍️</div>
                        <div class="mcp-name">Content</div>
                        <div class="mcp-description">AI content generation</div>
                    </div>
                    <div class="mcp-card active" onclick="toggleMCP(this)">
                        <div class="mcp-icon">🎯</div>
                        <div class="mcp-name">Campaigns</div>
                        <div class="mcp-description">Campaign orchestration</div>
                    </div>
                    <div class="mcp-card active" onclick="toggleMCP(this)">
                        <div class="mcp-icon">📰</div>
                        <div class="mcp-name">Media</div>
                        <div class="mcp-description">Journalist discovery</div>
                    </div>
                    <div class="mcp-card" onclick="toggleMCP(this)">
                        <div class="mcp-icon">🚨</div>
                        <div class="mcp-name">Crisis</div>
                        <div class="mcp-description">Crisis management</div>
                    </div>
                    <div class="mcp-card" onclick="toggleMCP(this)">
                        <div class="mcp-icon">🌊</div>
                        <div class="mcp-name">Cascade</div>
                        <div class="mcp-description">Effect prediction</div>
                    </div>
                    <div class="mcp-card" onclick="toggleMCP(this)">
                        <div class="mcp-icon">📱</div>
                        <div class="mcp-name">Social</div>
                        <div class="mcp-description">Social media ops</div>
                    </div>
                    <div class="mcp-card" onclick="toggleMCP(this)">
                        <div class="mcp-icon">⚖️</div>
                        <div class="mcp-name">Regulatory</div>
                        <div class="mcp-description">Compliance tracking</div>
                    </div>
                </div>

                <div style="background: #374151; padding: 20px; border-radius: 12px; margin-top: 30px;">
                    <div style="font-weight: 600; margin-bottom: 10px;">🎯 Recommended Configuration</div>
                    <div style="font-size: 14px; color: #9CA3AF;">We've pre-selected the essential systems. You can customize these based on your needs.</div>
                </div>
            </div>

            <!-- Completion Screen -->
            <div class="step-content" id="completion">
                <div class="completion-screen">
                    <div class="checkmark">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <h1 style="font-size: 36px; margin-bottom: 20px;">PR Command Center Activated!</h1>
                    <p style="font-size: 18px; color: #9CA3AF; margin-bottom: 40px;">
                        Niv is ready to orchestrate your strategic PR campaigns
                    </p>

                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">12</div>
                            <div class="stat-label">Campaign Templates Ready</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">85%</div>
                            <div class="stat-label">PR Readiness Score</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">Real-time</div>
                            <div class="stat-label">Opportunity Detection</div>
                        </div>
                    </div>

                    <button class="btn btn-primary" style="margin-top: 20px;" onclick="launchDashboard()">
                        Launch PR Command Center →
                    </button>
                </div>
            </div>
        </div>

        <div class="button-group" id="navigationButtons">
            <button class="btn btn-secondary" id="prevBtn" onclick="changeStep(-1)" style="display: none;">
                ← Previous
            </button>
            <button class="btn btn-primary" id="nextBtn" onclick="changeStep(1)">
                Next Step →
            </button>
        </div>
    </div>

    <script>
        let currentStep = 1;
        const totalSteps = 5;
        let selectedObjectives = [];

        const stepTitles = {
            1: "Configure Your PR Command Center",
            2: "Define Strategic Objectives",
            3: "Opportunity Discovery Engine",
            4: "Campaign Orchestration",
            5: "Activate Intelligence Systems"
        };

        const stepSubtitles = {
            1: "Let's set up your autonomous PR orchestration system",
            2: "What PR outcomes will drive your business forward?",
            3: "Configure how SignalDesk discovers PR opportunities",
            4: "Set your campaign automation preferences",
            5: "Choose which intelligence systems to activate"
        };

        function changeStep(direction) {
            // Hide current step
            document.getElementById(`step${currentStep}`).classList.remove('active');

            // Update step
            currentStep += direction;

            // Show completion screen if done
            if (currentStep > totalSteps) {
                showCompletion();
                return;
            }

            // Show new step
            document.getElementById(`step${currentStep}`).classList.add('active');

            // Update progress
            updateProgress();

            // Update navigation buttons
            updateNavigation();

            // Update header
            updateHeader();
        }

        function updateProgress() {
            const progress = (currentStep / totalSteps) * 100;
            document.getElementById('progressBar').style.width = progress + '%';

            // Update step dots
            document.querySelectorAll('.step-dot').forEach((dot, index) => {
                if (index < currentStep - 1) {
                    dot.classList.add('completed');
                    dot.classList.remove('active');
                } else if (index === currentStep - 1) {
                    dot.classList.add('active');
                    dot.classList.remove('completed');
                } else {
                    dot.classList.remove('active', 'completed');
                }
            });
        }

        function updateNavigation() {
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');

            // Show/hide previous button
            prevBtn.style.display = currentStep === 1 ? 'none' : 'block';

            // Update next button text
            if (currentStep === totalSteps) {
                nextBtn.textContent = 'Activate Systems →';
            } else {
                nextBtn.textContent = 'Next Step →';
            }
        }

        function updateHeader() {
            document.getElementById('stepTitle').textContent = stepTitles[currentStep];
            document.getElementById('stepSubtitle').textContent = stepSubtitles[currentStep];
        }

        function showCompletion() {
            // Hide all steps
            document.querySelectorAll('.step-content').forEach(step => {
                step.classList.remove('active');
            });

            // Show completion screen
            document.getElementById('completion').classList.add('active');

            // Hide navigation buttons
            document.getElementById('navigationButtons').style.display = 'none';

            // Update progress to 100%
            document.getElementById('progressBar').style.width = '100%';

            // Update header
            document.getElementById('stepTitle').textContent = 'Setup Complete!';
            document.getElementById('stepSubtitle').textContent = 'Your autonomous PR system is ready for action';

            // Mark all dots as completed
            document.querySelectorAll('.step-dot').forEach(dot => {
                dot.classList.add('completed');
                dot.classList.remove('active');
            });
        }

        function toggleSlider(element) {
            element.classList.toggle('active');
        }

        function toggleMCP(element) {
            element.classList.toggle('active');
        }

        function launchDashboard() {
            alert('Launching SignalDesk PR Command Center...');
            // In production, this would redirect to the main dashboard
        }

        // Objective card selection (max 3)
        document.querySelectorAll('.objective-card').forEach(card => {
            card.addEventListener('click', function() {
                const objective = this.dataset.objective;

                if (this.classList.contains('selected')) {
                    // Deselect
                    this.classList.remove('selected');
                    selectedObjectives = selectedObjectives.filter(obj => obj !== objective);
                } else if (selectedObjectives.length < 3) {
                    // Select (if under limit)
                    this.classList.add('selected');
                    selectedObjectives.push(objective);
                } else {
                    // At limit - show message
                    alert('Please select up to 3 primary objectives. Deselect one to choose another.');
                }
            });
        });

        // Initialize
        updateProgress();
    </script>

</body>
</html>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SignalDesk Material Upload</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
            color: #E2E8F0;
            min-height: 100vh;
            padding: 40px 20px;
        }

        .upload-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            margin-bottom: 50px;
        }

        h1 {
            font-size: 42px;
            margin-bottom: 15px;
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            font-size: 20px;
            color: #9CA3AF;
            margin-bottom: 40px;
        }

        .upload-zone {
            background: #1F2937;
            border: 3px dashed #374151;
            border-radius: 16px;
            padding: 60px 40px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
            margin-bottom: 40px;
        }

        .upload-zone:hover {
            border-color: #6366F1;
            background: #1F293750;
        }

        .upload-zone.dragging {
            border-color: #10B981;
            background: #10B98110;
        }

        .upload-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .upload-title {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: 600;
        }

        .upload-description {
            color: #9CA3AF;
            font-size: 16px;
            margin-bottom: 30px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }

        .upload-button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            color: white;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            border: none;
        }

        .upload-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
        }

        .category-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .category-tab {
            padding: 10px 20px;
            background: #374151;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .category-tab:hover {
            background: #4B5563;
        }

        .category-tab.active {
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            color: white;
        }

        .materials-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }

        .material-card {
            background: #1F2937;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s ease;
            border: 2px solid transparent;
            position: relative;
            overflow: hidden;
        }

        .material-card:hover {
            border-color: #6366F1;
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .material-type {
            display: inline-block;
            padding: 4px 12px;
            background: #374151;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 12px;
            text-transform: uppercase;
        }

        .material-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #E2E8F0;
        }

        .material-meta {
            color: #9CA3AF;
            font-size: 14px;
            margin-bottom: 15px;
        }

        .material-status {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10B981;
        }

        .ai-enhancement {
            background: linear-gradient(135deg, #6366F120, #8B5CF620);
            border: 1px solid #6366F150;
            border-radius: 8px;
            padding: 12px;
            margin-top: 15px;
        }

        .ai-enhancement-title {
            font-size: 12px;
            font-weight: 600;
            color: #A5B4FC;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .ai-suggestions {
            font-size: 13px;
            color: #CBD5E1;
            line-height: 1.5;
        }

        .stats-bar {
            background: #1F2937;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 40px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
        }

        .stat-item {
            text-align: center;
        }

        .stat-value {
            font-size: 36px;
            font-weight: bold;
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 5px;
        }

        .stat-label {
            color: #9CA3AF;
            font-size: 14px;
        }

        .processing-indicator {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: #1F2937;
            border: 2px solid #6366F1;
            border-radius: 12px;
            padding: 20px;
            min-width: 300px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            display: none;
        }

        .processing-indicator.active {
            display: block;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        .processing-title {
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .processing-spinner {
            width: 20px;
            height: 20px;
            border: 3px solid #374151;
            border-top: 3px solid #6366F1;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .processing-items {
            font-size: 14px;
            color: #9CA3AF;
        }

        .processing-item {
            padding: 8px 0;
            border-bottom: 1px solid #374151;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .processing-item:last-child {
            border-bottom: none;
        }

        .quick-actions {
            position: fixed;
            bottom: 30px;
            left: 30px;
            display: flex;
            gap: 15px;
        }

        .action-button {
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background: linear-gradient(135deg, #6366F1, #8B5CF6);
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
        }

        .action-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
        }

        .readiness-score {
            background: #1F2937;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 40px;
            text-align: center;
        }

        .score-circle {
            width: 150px;
            height: 150px;
            margin: 0 auto 20px;
            position: relative;
        }

        .score-circle svg {
            transform: rotate(-90deg);
        }

        .score-circle-bg {
            fill: none;
            stroke: #374151;
            stroke-width: 10;
        }

        .score-circle-progress {
            fill: none;
            stroke: url(#gradient);
            stroke-width: 10;
            stroke-linecap: round;
            transition: stroke-dashoffset 1s ease;
        }

        .score-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 36px;
            font-weight: bold;
        }

        .score-label {
            font-size: 18px;
            color: #9CA3AF;
            margin-bottom: 20px;
        }

        .improvement-tips {
            text-align: left;
            background: #374151;
            border-radius: 8px;
            padding: 20px;
            margin-top: 20px;
        }

        .tip-item {
            padding: 10px 0;
            border-bottom: 1px solid #4B5563;
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
        }

        .tip-item:last-child {
            border-bottom: none;
        }

        .tip-icon {
            width: 20px;
            height: 20px;
            background: #10B981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: white;
        }
    </style>

</head>
<body>
    <div class="upload-container">
        <div class="header">
            <h1>Strategic PR Asset Library</h1>
            <p class="subtitle">Build your arsenal for rapid campaign deployment and opportunity response</p>
        </div>

        <!-- Campaign Readiness Score -->
        <div class="readiness-score">
            <div class="score-circle">
                <svg width="150" height="150">
                    <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style="stop-color:#6366F1;stop-opacity:1" />
                            <stop offset="100%" style="stop-color:#8B5CF6;stop-opacity:1" />
                        </linearGradient>
                    </defs>
                    <circle cx="75" cy="75" r="65" class="score-circle-bg"></circle>
                    <circle cx="75" cy="75" r="65" class="score-circle-progress"
                            stroke-dasharray="408" stroke-dashoffset="102"></circle>
                </svg>
                <div class="score-text">75%</div>
            </div>
            <div class="score-label">Campaign Readiness Score</div>
            <div class="improvement-tips">
                <div class="tip-item">
                    <div class="tip-icon">✓</div>
                    <span>12 campaign templates ready for deployment</span>
                </div>
                <div class="tip-item">
                    <div class="tip-icon">✓</div>
                    <span>Cascade intelligence patterns identified</span>
                </div>
                <div class="tip-item">
                    <div class="tip-icon">!</div>
                    <span>Add competitive positioning materials for stronger differentiation</span>
                </div>
            </div>
        </div>

        <!-- Upload Zone -->
        <div class="upload-zone" id="uploadZone">
            <div class="upload-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
            </div>
            <h2 class="upload-title">Import your PR arsenal</h2>
            <p class="upload-description">
                Press materials, campaign templates, positioning documents, competitive intelligence -
                Niv will analyze patterns and create opportunity-specific templates
            </p>
            <button class="upload-button" onclick="selectFiles()">
                Select Files to Upload
            </button>
            <input type="file" id="fileInput" multiple style="display: none;">
        </div>

        <!-- Stats Bar -->
        <div class="stats-bar">
            <div class="stat-item">
                <div class="stat-value" id="totalMaterials">0</div>
                <div class="stat-label">Total Materials</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="aiEnhanced">0</div>
                <div class="stat-label">AI Enhanced</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="templatesCreated">0</div>
                <div class="stat-label">Templates Created</div>
            </div>
            <div class="stat-item">
                <div class="stat-value" id="readyToDeploy">0</div>
                <div class="stat-label">Ready to Deploy</div>
            </div>
        </div>

        <!-- Category Tabs -->
        <div class="category-tabs">
            <div class="category-tab active" onclick="filterCategory('all')">
                <span>📁</span> All Materials
            </div>
            <div class="category-tab" onclick="filterCategory('press-releases')">
                <span>📰</span> Press Releases
            </div>
            <div class="category-tab" onclick="filterCategory('bios')">
                <span>👤</span> Executive Bios
            </div>
            <div class="category-tab" onclick="filterCategory('case-studies')">
                <span>📊</span> Case Studies
            </div>
            <div class="category-tab" onclick="filterCategory('crisis')">
                <span>🚨</span> Crisis Templates
            </div>
            <div class="category-tab" onclick="filterCategory('images')">
                <span>🖼️</span> Brand Assets
            </div>
            <div class="category-tab" onclick="filterCategory('fact-sheets')">
                <span>📄</span> Fact Sheets
            </div>
        </div>

        <!-- Materials Grid -->
        <div class="materials-grid" id="materialsGrid">
            <!-- Materials will be dynamically added here -->
        </div>

        <!-- Processing Indicator -->
        <div class="processing-indicator" id="processingIndicator">
            <div class="processing-title">
                <div class="processing-spinner"></div>
                AI Processing Materials
            </div>
            <div class="processing-items" id="processingItems">
                <!-- Processing items will be added here -->
            </div>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
            <button class="action-button" onclick="bulkEnhance()" title="Bulk AI Enhancement">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z"></path>
                    <path d="M2 17L12 22L22 17"></path>
                    <path d="M2 12L12 17L22 12"></path>
                </svg>
            </button>
            <button class="action-button" onclick="generateTemplates()" title="Generate Templates">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="9" y1="9" x2="15" y2="9"></line>
                    <line x1="9" y1="13" x2="15" y2="13"></line>
                    <line x1="9" y1="17" x2="11" y2="17"></line>
                </svg>
            </button>
            <button class="action-button" onclick="exportMaterials()" title="Export All">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
            </button>
        </div>
    </div>

    <script>
        let uploadedMaterials = [];
        let currentFilter = 'all';

        // Initialize upload zone
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');

        // Drag and drop handlers
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragging');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragging');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragging');
            handleFiles(e.dataTransfer.files);
        });

        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });

        function selectFiles() {
            fileInput.click();
        }

        function handleFiles(files) {
            const fileArray = Array.from(files);
            showProcessingIndicator(fileArray);

            fileArray.forEach((file, index) => {
                setTimeout(() => {
                    processSingleFile(file);
                }, index * 500);
            });
        }

        function processSingleFile(file) {
            const material = {
                id: Date.now() + Math.random(),
                name: file.name,
                type: categorizeFile(file),
                size: formatFileSize(file.size),
                status: 'processing',
                aiEnhanced: false
            };

            uploadedMaterials.push(material);
            updateStats();
            renderMaterials();

            // Simulate AI processing
            setTimeout(() => {
                material.status = 'ready';
                material.aiEnhanced = true;
                material.suggestions = generateAISuggestions(material.type);
                updateStats();
                renderMaterials();
                updateProcessingIndicator(material.name, 'completed');
            }, 2000 + Math.random() * 2000);
        }

        function categorizeFile(file) {
            const fileName = file.name.toLowerCase();
            if (fileName.includes('release') || fileName.includes('announcement')) return 'press-releases';
            if (fileName.includes('bio') || fileName.includes('executive')) return 'bios';
            if (fileName.includes('case') || fileName.includes('study')) return 'case-studies';
            if (fileName.includes('crisis') || fileName.includes('emergency')) return 'crisis';
            if (file.type.startsWith('image/')) return 'images';
            return 'fact-sheets';
        }

        function formatFileSize(bytes) {
            if (bytes < 1024) return bytes + ' B';
            if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }

        function generateAISuggestions(type) {
            const suggestions = {
                'press-releases': 'Created 3 campaign variations. Identified opportunity triggers for tech disruption narrative.',
                'bios': 'Mapped expertise to 7 trending topics. Generated speaker pitch angles.',
                'case-studies': 'Extracted success patterns. Created competitive differentiation talking points.',
                'crisis': 'Built cascade prediction model. Generated 5 scenario response frameworks.',
                'images': 'Catalogued for rapid deployment. Tagged with campaign themes.',
                'fact-sheets': 'Identified narrative ammunition. Created proof points for positioning.'
            };
            return suggestions[type] || 'Analyzed for opportunity exploitation. Strategic patterns identified.';
        }

        function renderMaterials() {
            const grid = document.getElementById('materialsGrid');
            const filteredMaterials = currentFilter === 'all'
                ? uploadedMaterials
                : uploadedMaterials.filter(m => m.type === currentFilter);

            grid.innerHTML = filteredMaterials.map(material => `
                <div class="material-card">
                    <div class="material-type">${material.type.replace('-', ' ')}</div>
                    <div class="material-title">${material.name}</div>
                    <div class="material-meta">${material.size}</div>
                    <div class="material-status">
                        <div class="status-dot"></div>
                        <span>${material.status === 'ready' ? 'Ready to deploy' : 'Processing...'}</span>
                    </div>
                    ${material.aiEnhanced ? `
                        <div class="ai-enhancement">
                            <div class="ai-enhancement-title">
                                ⚡ Strategic Intelligence
                            </div>
                            <div class="ai-suggestions">${material.suggestions}</div>
                        </div>
                    ` : ''}
                </div>
            `).join('');
        }

        function updateStats() {
            document.getElementById('totalMaterials').textContent = uploadedMaterials.length;
            document.getElementById('aiEnhanced').textContent = uploadedMaterials.filter(m => m.aiEnhanced).length;
            document.getElementById('templatesCreated').textContent = Math.floor(uploadedMaterials.length * 0.6);
            document.getElementById('readyToDeploy').textContent = uploadedMaterials.filter(m => m.status === 'ready').length;

            // Update readiness score
            const score = Math.min(75 + uploadedMaterials.length * 2, 100);
            document.querySelector('.score-text').textContent = score + '%';
            const circumference = 2 * Math.PI * 65;
            const offset = circumference - (score / 100 * circumference);
            document.querySelector('.score-circle-progress').style.strokeDashoffset = offset;
        }

        function filterCategory(category) {
            currentFilter = category;
            document.querySelectorAll('.category-tab').forEach(tab => tab.classList.remove('active'));
            event.target.closest('.category-tab').classList.add('active');
            renderMaterials();
        }

        function showProcessingIndicator(files) {
            const indicator = document.getElementById('processingIndicator');
            const itemsContainer = document.getElementById('processingItems');

            indicator.classList.add('active');
            itemsContainer.innerHTML = files.map(file => `
                <div class="processing-item" data-file="${file.name}">
                    <span>${file.name}</span>
                    <span>🔄</span>
                </div>
            `).join('');
        }

        function updateProcessingIndicator(fileName, status) {
            const item = document.querySelector(`[data-file="${fileName}"]`);
            if (item) {
                item.querySelector('span:last-child').textContent = status === 'completed' ? '✅' : '🔄';
            }

            // Hide indicator if all files are processed
            const allProcessed = document.querySelectorAll('.processing-item span:last-child')
                .length === document.querySelectorAll('.processing-item span:contains("✅")').length;

            if (uploadedMaterials.every(m => m.status === 'ready')) {
                setTimeout(() => {
                    document.getElementById('processingIndicator').classList.remove('active');
                }, 2000);
            }
        }

        function bulkEnhance() {
            alert('Starting bulk AI enhancement for all materials...');
        }

        function generateTemplates() {
            alert('Generating smart templates based on your materials...');
        }

        function exportMaterials() {
            alert('Exporting all enhanced materials...');
        }

        // Simulate some initial materials
        setTimeout(() => {
            const sampleFiles = [
                { name: 'Q4_2024_Earnings_Release.pdf', size: 1024 * 245 },
                { name: 'CEO_Executive_Bio.docx', size: 1024 * 89 },
                { name: 'Product_Launch_Case_Study.pdf', size: 1024 * 512 }
            ];

            sampleFiles.forEach(file => {
                processSingleFile({
                    name: file.name,
                    size: file.size,
                    type: 'application/pdf'
                });
            });
        }, 1000);
    </script>

</body>
</html>
