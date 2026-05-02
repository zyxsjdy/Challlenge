import * as fs from 'fs';
import * as path from 'path';

/**
 * Raw card data structure from CSV
 */
export interface RawCardData {
  id: string;
  category: string;
  name: string;
  value: number;
  fullSetNumber: number | null;
  rentValue: number[] | null;
  function: string;
  constraint: string;
}

/**
 * CSV Parser for carddata.csv
 * CRITICAL: Stops at row 106 (not 996 or beyond)
 */
export class CSVParser {
  /**
   * Parse carddata.csv and return array of raw card data
   * @param csvPath - Path to CSV file relative to project root
   * @returns Array of 106 card data objects
   */
  static parse(csvPath: string): RawCardData[] {
    const fullPath = path.resolve(process.cwd(), csvPath);
    
    if (!fs.existsSync(fullPath)) {
      throw new Error(`CSV file not found at: ${fullPath}`);
    }

    const fileContent = fs.readFileSync(fullPath, 'utf-8');
    const lines = fileContent.split('\n');
    
    const cards: RawCardData[] = [];
    
    // CRITICAL: Stop at row 106 (line index 106, since line 0 is header)
    // CSV has 996 lines but only first 106 rows contain valid card data
    const MAX_CARDS = 106;
    
    for (let i = 1; i <= MAX_CARDS && i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      const columns = this.parseCSVLine(line);
      
      // Skip if not enough columns
      if (columns.length < 8) continue;
      
      const rawCard: RawCardData = {
        id: columns[0], // Card number (1-106)
        category: columns[1],
        name: columns[2],
        value: this.parseMonetaryValue(columns[3]),
        fullSetNumber: this.parseNumber(columns[4]),
        rentValue: this.parseRentValues(columns[5]),
        function: columns[6],
        constraint: columns[7]
      };
      
      cards.push(rawCard);
    }
    
    console.log(`Parsed ${cards.length} cards from CSV (expected 106)`);
    
    if (cards.length !== MAX_CARDS) {
      console.warn(`Warning: Expected ${MAX_CARDS} cards but parsed ${cards.length}`);
    }
    
    return cards;
  }

  /**
   * Parse CSV line handling quoted fields with commas
   */
  private static parseCSVLine(line: string): string[] {
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last column
    columns.push(current.trim());
    
    return columns;
  }

  /**
   * Extract monetary value from string (e.g., "$5M" → 5, "0" → 0)
   * CRITICAL: "10-Color Multi-Color" wildcard has value "0" (not "$0M")
   */
  private static parseMonetaryValue(valueStr: string): number {
    if (!valueStr || valueStr === '') return 0;
    
    // Handle "0" for 10-Color Wildcard
    if (valueStr === '0') return 0;
    
    // Extract number from format like "$5M", "$10M"
    const match = valueStr.match(/\$?(\d+)M?/);
    if (match) {
      return parseInt(match[1], 10);
    }
    
    return 0;
  }

  /**
   * Parse number or return null if empty
   */
  private static parseNumber(str: string): number | null {
    if (!str || str === '') return null;
    const num = parseInt(str, 10);
    return isNaN(num) ? null : num;
  }

  /**
   * Parse rent values from comma-separated string (e.g., "1,2,3" → [1,2,3])
   */
  private static parseRentValues(rentStr: string): number[] | null {
    if (!rentStr || rentStr === '') return null;
    
    const values = rentStr.split(',').map(v => {
      const num = parseInt(v.trim(), 10);
      return isNaN(num) ? 0 : num;
    });
    
    return values.length > 0 ? values : null;
  }
}

// Made with Bob