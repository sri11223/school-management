import { DatabaseManager } from '../database/DatabaseManager';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

export interface FeeStructure {
  id?: number;
  class_id: number;
  academic_year_id: number;
  fee_type: 'Tuition' | 'Transport' | 'Library' | 'Laboratory' | 'Sports' | 'Exam' | 'Development' | 'Other';
  amount: number;
  frequency: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Annual' | 'One Time';
  due_date: string;
  description?: string;
  is_mandatory: boolean;
  late_fee_applicable: boolean;
  late_fee_amount?: number;
  late_fee_days?: number;
  status: 'Active' | 'Inactive';
  created_at?: string;
  updated_at?: string;
}

export interface FeePayment {
  id?: number;
  student_id: number;
  fee_structure_id: number;
  academic_year_id: number;
  amount_due: number;
  amount_paid: number;
  payment_date: string;
  payment_method: 'Cash' | 'Bank Transfer' | 'Online' | 'Cheque' | 'DD';
  transaction_id?: string;
  receipt_number: string;
  late_fee: number;
  discount: number;
  remarks?: string;
  payment_status: 'Paid' | 'Partial' | 'Pending' | 'Overdue';
  collected_by: number;
  created_at?: string;
  updated_at?: string;
}

export interface FeeDiscount {
  id?: number;
  student_id: number;
  fee_structure_id: number;
  discount_type: 'Percentage' | 'Fixed Amount' | 'Scholarship' | 'Sibling Discount';
  discount_value: number;
  reason: string;
  valid_from: string;
  valid_to: string;
  approved_by: number;
  status: 'Active' | 'Expired' | 'Cancelled';
  created_at?: string;
}

export interface FeeFilters {
  class_id?: number;
  academic_year_id?: number;
  student_id?: number;
  fee_type?: string;
  payment_status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export class FeeService {
  private dbManager: DatabaseManager;

  constructor() {
    this.dbManager = DatabaseManager.getInstance();
  }

  // Fee Structure Management
  async createFeeStructure(feeData: Omit<FeeStructure, 'id' | 'created_at' | 'updated_at'>): Promise<FeeStructure> {
    const query = `
      INSERT INTO fee_structures (
        class_id, academic_year_id, fee_type, amount, frequency,
        due_date, description, is_mandatory, late_fee_applicable,
        late_fee_amount, late_fee_days, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      feeData.class_id,
      feeData.academic_year_id,
      feeData.fee_type,
      feeData.amount,
      feeData.frequency,
      feeData.due_date,
      feeData.description,
      feeData.is_mandatory,
      feeData.late_fee_applicable,
      feeData.late_fee_amount,
      feeData.late_fee_days,
      feeData.status || 'Active'
    ];

    const result = await this.dbManager.runQuery(query, params);
    const feeStructure = await this.dbManager.getAll('SELECT * FROM fee_structures WHERE id = ?', [result.lastID]);
    return feeStructure[0];
  }

  async getFeeStructures(page: number = 1, limit: number = 10, filters: FeeFilters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        fs.*,
        c.name as class_name,
        c.grade,
        c.section,
        ay.year as academic_year,
        COUNT(*) OVER() as total_count
      FROM fee_structures fs
      JOIN classes c ON fs.class_id = c.id
      JOIN academic_years ay ON fs.academic_year_id = ay.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters.class_id) {
      query += ` AND fs.class_id = ?`;
      params.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      query += ` AND fs.academic_year_id = ?`;
      params.push(filters.academic_year_id);
    }

    if (filters.fee_type) {
      query += ` AND fs.fee_type = ?`;
      params.push(filters.fee_type);
    }

    query += ` ORDER BY fs.due_date, fs.fee_type LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const feeStructures = await this.dbManager.getAll(query, params);
    const totalCount = feeStructures.length > 0 ? feeStructures[0].total_count : 0;

    // Remove total_count from individual records
    feeStructures.forEach(fee => delete fee.total_count);

    return {
      feeStructures,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async updateFeeStructure(id: number, feeData: Partial<FeeStructure>): Promise<FeeStructure> {
    const existingFee = await this.getFeeStructureById(id);
    if (!existingFee) {
      throw new NotFoundError('Fee structure not found');
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(feeData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existingFee;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `UPDATE fee_structures SET ${updateFields.join(', ')} WHERE id = ?`;
    await this.dbManager.runQuery(query, params);

    return await this.getFeeStructureById(id) as FeeStructure;
  }

  async getFeeStructureById(id: number): Promise<FeeStructure | null> {
    const query = `
      SELECT fs.*, c.name as class_name, ay.year as academic_year
      FROM fee_structures fs
      JOIN classes c ON fs.class_id = c.id
      JOIN academic_years ay ON fs.academic_year_id = ay.id
      WHERE fs.id = ?
    `;
    const feeStructures = await this.dbManager.getAll(query, [id]);
    return feeStructures.length > 0 ? feeStructures[0] : null;
  }

  // Fee Payment Management
  async recordPayment(paymentData: Omit<FeePayment, 'id' | 'created_at' | 'updated_at'>): Promise<FeePayment> {
    // Generate receipt number
    const receiptNumber = await this.generateReceiptNumber();

    const query = `
      INSERT INTO fee_payments (
        student_id, fee_structure_id, academic_year_id, amount_due,
        amount_paid, payment_date, payment_method, transaction_id,
        receipt_number, late_fee, discount, remarks, payment_status, collected_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const status = paymentData.amount_paid >= paymentData.amount_due ? 'Paid' : 'Partial';

    const params = [
      paymentData.student_id,
      paymentData.fee_structure_id,
      paymentData.academic_year_id,
      paymentData.amount_due,
      paymentData.amount_paid,
      paymentData.payment_date,
      paymentData.payment_method,
      paymentData.transaction_id,
      receiptNumber,
      paymentData.late_fee || 0,
      paymentData.discount || 0,
      paymentData.remarks,
      status,
      paymentData.collected_by
    ];

    const result = await this.dbManager.runQuery(query, params);
    const payment = await this.dbManager.getAll('SELECT * FROM fee_payments WHERE id = ?', [result.lastID]);
    return payment[0];
  }

  async getFeePayments(page: number = 1, limit: number = 10, filters: FeeFilters = {}) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT 
        fp.*,
        s.first_name || ' ' || s.last_name as student_name,
        s.admission_number,
        s.roll_number,
        fs.fee_type,
        fs.frequency,
        c.name as class_name,
        c.grade,
        c.section,
        t.first_name || ' ' || t.last_name as collected_by_name,
        COUNT(*) OVER() as total_count
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      JOIN fee_structures fs ON fp.fee_structure_id = fs.id
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON fp.collected_by = t.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Apply filters
    if (filters.student_id) {
      query += ` AND fp.student_id = ?`;
      params.push(filters.student_id);
    }

    if (filters.class_id) {
      query += ` AND c.id = ?`;
      params.push(filters.class_id);
    }

    if (filters.academic_year_id) {
      query += ` AND fp.academic_year_id = ?`;
      params.push(filters.academic_year_id);
    }

    if (filters.payment_status) {
      query += ` AND fp.payment_status = ?`;
      params.push(filters.payment_status);
    }

    if (filters.date_from) {
      query += ` AND fp.payment_date >= ?`;
      params.push(filters.date_from);
    }

    if (filters.date_to) {
      query += ` AND fp.payment_date <= ?`;
      params.push(filters.date_to);
    }

    if (filters.search) {
      query += ` AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ? OR fp.receipt_number LIKE ?)`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY fp.payment_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const payments = await this.dbManager.getAll(query, params);
    const totalCount = payments.length > 0 ? payments[0].total_count : 0;

    // Remove total_count from individual records
    payments.forEach(payment => delete payment.total_count);

    return {
      payments,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    };
  }

  async getStudentFeeStatus(studentId: number, academicYearId?: number) {
    let query = `
      SELECT 
        fs.id as fee_structure_id,
        fs.fee_type,
        fs.amount as total_amount,
        fs.frequency,
        fs.due_date,
        fs.is_mandatory,
        fs.late_fee_applicable,
        fs.late_fee_amount,
        fs.late_fee_days,
        COALESCE(SUM(fp.amount_paid), 0) as paid_amount,
        COALESCE(SUM(fp.discount), 0) as total_discount,
        COALESCE(SUM(fp.late_fee), 0) as total_late_fee,
        (fs.amount - COALESCE(SUM(fp.amount_paid), 0) - COALESCE(SUM(fp.discount), 0)) as balance_amount,
        CASE 
          WHEN COALESCE(SUM(fp.amount_paid), 0) + COALESCE(SUM(fp.discount), 0) >= fs.amount THEN 'Paid'
          WHEN COALESCE(SUM(fp.amount_paid), 0) > 0 THEN 'Partial'
          WHEN DATE(fs.due_date) < DATE('now') THEN 'Overdue'
          ELSE 'Pending'
        END as payment_status
      FROM fee_structures fs
      JOIN students s ON s.class_id = fs.class_id
      LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.student_id = s.id
      WHERE s.id = ?
    `;
    const params: any[] = [studentId];

    if (academicYearId) {
      query += ` AND fs.academic_year_id = ?`;
      params.push(academicYearId);
    }

    query += `
      GROUP BY fs.id, fs.fee_type, fs.amount, fs.frequency, fs.due_date,
               fs.is_mandatory, fs.late_fee_applicable, fs.late_fee_amount, fs.late_fee_days
      ORDER BY fs.due_date
    `;

    return await this.dbManager.getAll(query, params);
  }

  async getOverdueFees(classId?: number, academicYearId?: number) {
    let query = `
      SELECT 
        s.id as student_id,
        s.first_name || ' ' || s.last_name as student_name,
        s.admission_number,
        s.phone,
        c.name as class_name,
        c.grade,
        c.section,
        fs.fee_type,
        fs.amount,
        fs.due_date,
        COALESCE(SUM(fp.amount_paid), 0) as paid_amount,
        (fs.amount - COALESCE(SUM(fp.amount_paid), 0)) as balance_amount,
        (julianday('now') - julianday(fs.due_date)) as days_overdue
      FROM fee_structures fs
      JOIN students s ON s.class_id = fs.class_id
      JOIN classes c ON s.class_id = c.id
      LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.student_id = s.id
      WHERE fs.due_date < DATE('now')
      AND (fs.amount - COALESCE(SUM(fp.amount_paid), 0)) > 0
      AND s.status = 'Active'
    `;
    const params: any[] = [];

    if (classId) {
      query += ` AND c.id = ?`;
      params.push(classId);
    }

    if (academicYearId) {
      query += ` AND fs.academic_year_id = ?`;
      params.push(academicYearId);
    }

    query += `
      GROUP BY s.id, s.first_name, s.last_name, s.admission_number, s.phone,
               c.name, c.grade, c.section, fs.fee_type, fs.amount, fs.due_date
      HAVING balance_amount > 0
      ORDER BY days_overdue DESC, s.first_name
    `;

    return await this.dbManager.getAll(query, params);
  }

  // Fee Discount Management
  async applyDiscount(discountData: Omit<FeeDiscount, 'id' | 'created_at'>): Promise<FeeDiscount> {
    const query = `
      INSERT INTO fee_discounts (
        student_id, fee_structure_id, discount_type, discount_value,
        reason, valid_from, valid_to, approved_by, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      discountData.student_id,
      discountData.fee_structure_id,
      discountData.discount_type,
      discountData.discount_value,
      discountData.reason,
      discountData.valid_from,
      discountData.valid_to,
      discountData.approved_by,
      discountData.status || 'Active'
    ];

    const result = await this.dbManager.runQuery(query, params);
    const discount = await this.dbManager.getAll('SELECT * FROM fee_discounts WHERE id = ?', [result.lastID]);
    return discount[0];
  }

  async getStudentDiscounts(studentId: number): Promise<FeeDiscount[]> {
    const query = `
      SELECT 
        fd.*,
        fs.fee_type,
        fs.amount as fee_amount,
        t.first_name || ' ' || t.last_name as approved_by_name
      FROM fee_discounts fd
      JOIN fee_structures fs ON fd.fee_structure_id = fs.id
      JOIN teachers t ON fd.approved_by = t.id
      WHERE fd.student_id = ? AND fd.status = 'Active'
      ORDER BY fd.valid_from DESC
    `;
    return await this.dbManager.getAll(query, [studentId]);
  }

  // Financial Reports
  async getFeeCollectionReport(startDate: string, endDate: string, classId?: number) {
    let query = `
      SELECT 
        DATE(fp.payment_date) as payment_date,
        COUNT(*) as transaction_count,
        SUM(fp.amount_paid) as total_collected,
        SUM(fp.late_fee) as late_fee_collected,
        SUM(fp.discount) as total_discount,
        fp.payment_method,
        COUNT(DISTINCT fp.student_id) as unique_students
      FROM fee_payments fp
      JOIN students s ON fp.student_id = s.id
      WHERE fp.payment_date BETWEEN ? AND ?
    `;
    const params: any[] = [startDate, endDate];

    if (classId) {
      query += ` AND s.class_id = ?`;
      params.push(classId);
    }

    query += `
      GROUP BY DATE(fp.payment_date), fp.payment_method
      ORDER BY payment_date DESC, payment_method
    `;

    return await this.dbManager.getAll(query, params);
  }

  async getFeeTypeReport(academicYearId: number, classId?: number) {
    let query = `
      SELECT 
        fs.fee_type,
        COUNT(DISTINCT s.id) as total_students,
        SUM(fs.amount) as total_expected,
        COALESCE(SUM(fp.amount_paid), 0) as total_collected,
        COALESCE(SUM(fp.discount), 0) as total_discount,
        (SUM(fs.amount) - COALESCE(SUM(fp.amount_paid), 0) - COALESCE(SUM(fp.discount), 0)) as total_pending,
        ROUND(
          (COALESCE(SUM(fp.amount_paid), 0) * 100.0) / SUM(fs.amount), 2
        ) as collection_percentage
      FROM fee_structures fs
      JOIN students s ON s.class_id = fs.class_id
      LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.student_id = s.id
      WHERE fs.academic_year_id = ? AND s.status = 'Active'
    `;
    const params: any[] = [academicYearId];

    if (classId) {
      query += ` AND fs.class_id = ?`;
      params.push(classId);
    }

    query += `
      GROUP BY fs.fee_type
      ORDER BY fs.fee_type
    `;

    return await this.dbManager.getAll(query, params);
  }

  private async generateReceiptNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const query = `
      SELECT COUNT(*) + 1 as next_number 
      FROM fee_payments 
      WHERE strftime('%Y', payment_date) = ?
    `;
    const result = await this.dbManager.getAll(query, [currentYear.toString()]);
    const nextNumber = result[0].next_number;
    return `RCP${currentYear}${nextNumber.toString().padStart(6, '0')}`;
  }

  async getFeeStatistics(academicYearId: number, classId?: number) {
    let query = `
      SELECT 
        COUNT(DISTINCT s.id) as total_students,
        SUM(fs.amount) as total_expected_amount,
        COALESCE(SUM(fp.amount_paid), 0) as total_collected_amount,
        COALESCE(SUM(fp.discount), 0) as total_discount_amount,
        COALESCE(SUM(fp.late_fee), 0) as total_late_fee_collected,
        (SUM(fs.amount) - COALESCE(SUM(fp.amount_paid), 0) - COALESCE(SUM(fp.discount), 0)) as total_pending_amount,
        COUNT(DISTINCT CASE WHEN COALESCE(SUM(fp.amount_paid), 0) + COALESCE(SUM(fp.discount), 0) >= fs.amount THEN s.id END) as students_paid_full,
        COUNT(DISTINCT CASE WHEN COALESCE(SUM(fp.amount_paid), 0) > 0 AND COALESCE(SUM(fp.amount_paid), 0) + COALESCE(SUM(fp.discount), 0) < fs.amount THEN s.id END) as students_partial_paid,
        COUNT(DISTINCT CASE WHEN COALESCE(SUM(fp.amount_paid), 0) = 0 THEN s.id END) as students_unpaid
      FROM fee_structures fs
      JOIN students s ON s.class_id = fs.class_id
      LEFT JOIN fee_payments fp ON fs.id = fp.fee_structure_id AND fp.student_id = s.id
      WHERE fs.academic_year_id = ? AND s.status = 'Active'
    `;
    const params: any[] = [academicYearId];

    if (classId) {
      query += ` AND fs.class_id = ?`;
      params.push(classId);
    }

    const stats = await this.dbManager.getAll(query, params);
    const result = stats[0];

    // Calculate percentages
    const collectionPercentage = result.total_expected_amount > 0 
      ? (result.total_collected_amount / result.total_expected_amount) * 100 
      : 0;

    return {
      ...result,
      collection_percentage: Math.round(collectionPercentage * 100) / 100
    };
  }
}
