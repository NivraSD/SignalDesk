class SupabaseDataService {
  supabaseUrl: string;
  supabaseKey: string;

  constructor() {
    this.supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    this.supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  }

  async clearAnalysis(organizationName: string) {
    // This would clear analysis data from Supabase
    console.log(`Clearing analysis for ${organizationName}`);
  }

  async saveAnalysis(organizationName: string, data: any) {
    try {
      const response = await fetch(
        `${this.supabaseUrl}/functions/v1/intelligence-persistence`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.supabaseKey}`
          },
          body: JSON.stringify({
            organization_name: organizationName,
            data
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to save analysis: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving analysis:', error);
      throw error;
    }
  }
}

export default new SupabaseDataService();