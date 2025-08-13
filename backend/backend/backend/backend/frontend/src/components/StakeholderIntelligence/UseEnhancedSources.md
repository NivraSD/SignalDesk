# How to Use the Enhanced Source System

## Quick Integration

To use the enhanced source configurator with pre-indexed database:

### 1. Import the Enhanced Components

```javascript
// In your main stakeholder intelligence component
import EnhancedSourceConfigurator from './EnhancedSourceConfigurator';
import { StakeholderSourceDatabase } from './EnhancedSourceDatabase';
```

### 2. Replace the Basic Source Configurator

Replace:
```javascript
import StakeholderSourceConfigurator from './StakeholderSourceConfigurator';
```

With:
```javascript
import EnhancedSourceConfigurator from './EnhancedSourceConfigurator';
```

### 3. Use in Your Component

The enhanced configurator has the same props as the original:

```javascript
<EnhancedSourceConfigurator 
  stakeholderStrategy={stakeholderStrategy}
  onSourcesUpdate={handleSourcesUpdate}
/>
```

## What You Get

### Pre-indexed Sources for Major Stakeholders:

1. **BlackRock**
   - Official investor relations site
   - Larry Fink's annual letters
   - SEC filings (13F, 13D, 13G)
   - Twitter accounts (@blackrock, @LarryFink)
   - Bloomberg & Reuters coverage
   - Investment stewardship reports

2. **Vanguard**
   - Investor relations
   - SEC filings
   - Stewardship reports

3. **SEC**
   - Press releases RSS
   - Enforcement actions RSS  
   - Proposed rules
   - Speeches & statements
   - Gary Gensler's Twitter

4. **Media Outlets**
   - TechCrunch main feed + categories
   - WSJ Business & Tech RSS
   - Reporter Twitter lists

### Automatic Features:

- **Instant Match Detection**: If user enters "BlackRock" or similar, instantly loads 15+ pre-configured sources
- **Smart Topics**: Pre-researched monitoring topics by stakeholder and industry
- **One-Click Activation**: Enable all sources for a stakeholder at once
- **Visual Indicators**: Shows which stakeholders have pre-indexed matches

### Enhanced UI:

- Pre-indexed matches highlighted with purple border
- Database icon shows verified sources
- Grid layout for better source visibility
- Source metadata (RSS, API, extraction method)
- Topic recommendations from database

## Example Usage

When a user adds "BlackRock" as a stakeholder:

1. System automatically detects the match
2. Loads 15+ pre-configured sources instantly
3. Shows relevant monitoring topics (ESG, governance, proxy voting)
4. User can enable all with one click
5. Sources include official sites, SEC filings, social media, news

No more manual source entry!

## Testing

To test the enhanced system:

1. Add a stakeholder named "BlackRock" or "SEC"
2. Watch it instantly populate with verified sources
3. Click "Enable All Sources" 
4. See the monitoring dashboard populate with real data

## Future Enhancements

The database can be expanded with:
- More institutional investors (Fidelity, T. Rowe Price, etc.)
- International regulators (FCA, ESMA, etc.)
- Industry analysts (Forrester, IDC)
- Major customers by industry
- Activist groups (Climate Action 100+, etc.)