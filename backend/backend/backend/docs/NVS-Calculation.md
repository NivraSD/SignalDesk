# Narrative Vacuum Score (NVS) Calculation

## Overview
The Narrative Vacuum Score (NVS) measures the opportunity space in a given topic area based on competitor weakness. A higher NVS indicates a larger "vacuum" or opportunity where competitors are weak or absent.

## Current Formula

```javascript
const nvs = Math.round(
  Math.max(0, Math.min(100, 
    (weaknessRatio * 100) - (counts.strong * 15) + (counts.none * 5)
  ))
);
```

## Components Breakdown

### 1. Weakness Ratio (Base Score)
```javascript
weaknessRatio = (counts.weak + counts.none) / total_competitors
```
- Represents the percentage of competitors that are weak or absent
- Forms the base of the NVS score (0-100 scale)

### 2. Strong Competitor Penalty
```javascript
- (counts.strong * 15)
```
- Each strong competitor reduces NVS by 15 points
- Reflects that strong competitors fill the narrative space

### 3. Absent Competitor Bonus
```javascript
+ (counts.none * 5)
```
- Each absent competitor adds 5 points to NVS
- Rewards topics where competitors have no presence

### 4. Bounds
```javascript
Math.max(0, Math.min(100, ...))
```
- Ensures NVS stays between 0-100

## Example Calculations

### Example 1: High Opportunity
- 5 competitors total
- Strong: 0, Moderate: 1, Weak: 2, None: 2
- weaknessRatio = (2 + 2) / 5 = 0.8
- NVS = (0.8 * 100) - (0 * 15) + (2 * 5) = 80 - 0 + 10 = **90**

### Example 2: Moderate Opportunity
- 5 competitors total
- Strong: 2, Moderate: 1, Weak: 1, None: 1
- weaknessRatio = (1 + 1) / 5 = 0.4
- NVS = (0.4 * 100) - (2 * 15) + (1 * 5) = 40 - 30 + 5 = **15**

### Example 3: Low Opportunity
- 5 competitors total
- Strong: 4, Moderate: 1, Weak: 0, None: 0
- weaknessRatio = (0 + 0) / 5 = 0
- NVS = (0 * 100) - (4 * 15) + (0 * 5) = 0 - 60 + 0 = **0** (clamped)

## Interpretation

### NVS Ranges
- **80-100**: Exceptional opportunity - significant competitive vacuum
- **60-79**: Strong opportunity - limited competition
- **40-59**: Moderate opportunity - some competitive gaps
- **20-39**: Limited opportunity - significant competition
- **0-19**: Minimal opportunity - saturated market

### Time Window Mapping
```javascript
if (nvs > 80 && momentum in ['hot', 'growing']) return 'immediate';
if (nvs > 60) return '3months';
if (nvs > 40) return '6months';
return '12months';
```

## Alternative Formulas Considered

### 1. Simple Percentage
```javascript
nvs = (1 - strongRatio) * 100
```
- Pro: Simple to understand
- Con: Doesn't differentiate between moderate/weak/none

### 2. Weighted Score
```javascript
nvs = (none * 100 + weak * 70 + moderate * 30) / total
```
- Pro: More nuanced scoring
- Con: Harder to interpret

### 3. Exponential Decay
```javascript
nvs = 100 * Math.exp(-strongCount / 2)
```
- Pro: Heavy penalty for strong competitors
- Con: Non-linear, harder to predict

## Proposed Improvements

### 1. Market Size Factor
```javascript
nvs = baseNVS * marketSizeFactor
```
Where larger markets get a multiplier (e.g., 1.2x for >$10B markets)

### 2. Trend Momentum Adjustment
```javascript
if (momentum === 'hot') nvs *= 1.1;
if (momentum === 'declining') nvs *= 0.8;
```

### 3. Competitor Trend Consideration
```javascript
// Adjust based on competitor trajectory
if (competitor.trend === 'declining') strength--;
if (competitor.trend === 'growing') strength++;
```

### 4. Market Maturity Factor
```javascript
// Emerging markets have more opportunity
if (maturity === 'emerging') nvs += 10;
if (maturity === 'mature') nvs -= 10;
```

## Implementation Location
The calculation is implemented in:
- `/backend/src/agents/topicMomentumAgents.js` - CompetitivePositioningAgent.calculateCompetitiveMetrics()