// Validation and error handling utilities for intelligence pipeline

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  fixedData?: any;
}

// Validate and fix monitoring data structure
export function validateMonitoringData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let fixedData = { ...data };
  
  // Ensure required fields exist
  if (!fixedData.findings) {
    warnings.push('Missing findings array, initializing as empty');
    fixedData.findings = [];
  }
  
  if (!Array.isArray(fixedData.findings)) {
    errors.push('Findings must be an array');
    fixedData.findings = [];
  }
  
  // Ensure 6-tab structure exists
  const requiredTabs = ['competition', 'stakeholders', 'market', 'trending', 'forward_looking', 'monitoring_config'];
  for (const tab of requiredTabs) {
    if (!fixedData[tab]) {
      warnings.push(`Missing ${tab} tab, initializing as empty object`);
      fixedData[tab] = {};
    }
  }
  
  // Ensure each tab has monitoring_findings array
  const tabsWithFindings = ['competition', 'stakeholders', 'market', 'trending'];
  for (const tab of tabsWithFindings) {
    if (!fixedData[tab].monitoring_findings) {
      fixedData[tab].monitoring_findings = [];
    }
    if (!Array.isArray(fixedData[tab].monitoring_findings)) {
      errors.push(`${tab}.monitoring_findings must be an array`);
      fixedData[tab].monitoring_findings = [];
    }
  }
  
  // Ensure raw data fields
  if (!fixedData.raw_signals) {
    fixedData.raw_signals = fixedData.findings || [];
  }
  
  if (!fixedData.raw_intelligence) {
    fixedData.raw_intelligence = {};
  }
  
  if (!fixedData.statistics) {
    fixedData.statistics = {
      total_articles: fixedData.total_articles || fixedData.findings?.length || 0,
      sources_count: 0,
      findings_count: fixedData.findings?.length || 0
    };
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    fixedData
  };
}

// Validate stage data before saving
export function validateStageData(stage: string, data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!stage) {
    errors.push('Stage name is required');
  }
  
  if (!data || typeof data !== 'object') {
    errors.push('Stage data must be an object');
  }
  
  // Stage-specific validation
  if (stage === 'monitoring') {
    return validateMonitoringData(data);
  }
  
  // Check for data size (prevent overly large payloads)
  const dataSize = JSON.stringify(data).length;
  if (dataSize > 10 * 1024 * 1024) { // 10MB limit
    errors.push(`Data size (${dataSize} bytes) exceeds 10MB limit`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Safe data extraction with fallbacks
export function safeExtractFindings(data: any): any[] {
  const findings: any[] = [];
  
  try {
    // Try root-level findings first
    if (data?.findings && Array.isArray(data.findings)) {
      findings.push(...data.findings);
    }
    
    // Try tab-specific findings
    const tabs = ['competition', 'stakeholders', 'market', 'trending'];
    for (const tab of tabs) {
      if (data?.[tab]?.monitoring_findings && Array.isArray(data[tab].monitoring_findings)) {
        // Avoid duplicates by checking IDs
        const tabFindings = data[tab].monitoring_findings.filter(
          (f: any) => !findings.some((existing: any) => 
            existing.id === f.id || 
            (existing.url === f.url && existing.title === f.title)
          )
        );
        findings.push(...tabFindings);
      }
    }
    
    // Fallback to raw_signals
    if (findings.length === 0 && data?.raw_signals && Array.isArray(data.raw_signals)) {
      findings.push(...data.raw_signals);
    }
  } catch (error) {
    console.error('Error extracting findings:', error);
  }
  
  return findings;
}

// Retry logic for persistence operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`Operation failed (attempt ${i + 1}/${maxRetries}):`, error);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

// Ensure data completeness for subsequent stages
export function ensureDataCompleteness(data: any, stage: string): any {
  const enhanced = { ...data };
  
  // Add metadata if missing
  if (!enhanced.metadata) {
    enhanced.metadata = {};
  }
  
  enhanced.metadata = {
    ...enhanced.metadata,
    validated_at: new Date().toISOString(),
    stage,
    structure_version: '6-tab-v1'
  };
  
  // Add trace ID for debugging
  if (!enhanced.trace_id) {
    enhanced.trace_id = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return enhanced;
}

// Log validation results
export function logValidation(stage: string, result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error(`❌ Validation failed for ${stage}:`, result.errors);
  }
  
  if (result.warnings.length > 0) {
    console.warn(`⚠️ Validation warnings for ${stage}:`, result.warnings);
  }
  
  if (result.isValid) {
    console.log(`✅ Validation passed for ${stage}`);
  }
}