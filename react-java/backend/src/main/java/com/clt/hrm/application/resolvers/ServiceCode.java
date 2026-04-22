package com.clt.hrm.application.resolvers;

/**
 * Service code constants used in TENT_SVC_IMPL.SVC_CD column
 * to identify which service implementation to use for a tenant.
 */
public final class ServiceCode {

    private ServiceCode() {
        // Utility class - prevent instantiation
    }

    /** Administration Company Service */
    public static final String ADM_COMPANY = "ADM_COMPANY";

    /** Administration Program Service */
    public static final String ADM_PROGRAM = "ADM_PROGRAM";

    /** Administration Role Service */
    public static final String ADM_ROLE = "ADM_ROLE";

    /** Administration User Service */
    public static final String ADM_USER = "ADM_USER";

    /** Authentication Service */
    public static final String AUTH = "AUTH";

    /** Organization Service */
    public static final String ADM_ORGANIZATION = "ADM_ORGANIZATION";

    /** Authentication Cache Service */
    public static final String AUTH_CACHE = "AUTH_CACHE";

    /** Common Code Service */
    public static final String COM_CODE = "COM_CODE";

    /** Administrative reference data service */
    public static final String COM_ADMINISTRATIVE = "COM_ADMINISTRATIVE";

    /** Holiday Service */
    public static final String COM_HOLIDAY = "COM_HOLIDAY";

    /** Allowance Service */
    public static final String COM_ALLOWANCE = "COM_ALLOWANCE";

    /** Insurance Rate Service */
    public static final String COM_INSURANCE_RATE = "COM_INSURANCE_RATE";

    /** Salary Formula Service */
    public static final String COM_SALARY_FORMULA = "COM_SALARY_FORMULA";

    /** Tax Rate Service */
    public static final String COM_TAX_RATE = "COM_TAX_RATE";

    /** Net To Gross Service */
    public static final String COM_NET_TO_GROSS = "COM_NET_TO_GROSS";

    /** Other Regulations Service */
    public static final String COM_OTHER_REGULATIONS = "COM_OTHER_REGULATIONS";

    /** Work Group Service */
    public static final String COM_WORKGROUP = "COM_WORKGROUP";

    /** Salary Grade Service */
    public static final String COM_SALARY_GRADE = "COM_SALARY_GRADE";

    /** Employee Disciplinary Reward Service */
    public static final String EMP_DISCIPLINARY_REWARD = "EMP_DISCIPLINARY_REWARD";

    /** Administration User Service */
    public static final String EMPLOYEE_RELATIVE = "EMPLOYEE_RELATIVE";

    /** Common Employee Service */
    public static final String EMP_COMMON = "EMP_COMMON";

    /** Employee Management Service */
    public static final String EMP_MANAGEMENT = "EMP_MANAGEMENT";

    /** Period Close Service */
    public static final String PRL_CLZ = "PRL_CLZ";

    /** Transfer Appointment Service */
    public static final String EMP_TRANSFER_APPOINTMENT = "EMP_TRANSFER_APPOINTMENT";

    /** Special Working Time Service */
    public static final String EMP_SPECIAL_WORKING_TIME = "EMP_SPECIAL_WORKING_TIME";

    /** Attendance Work Schedule Service */
    public static final String ATND_WORK_SCHEDULE = "ATND_WORK_SCHEDULE";

    /** Attendance Terminal Data Service */
    public static final String ATND_TERMINAL_DATA = "ATND_TERMINAL_DATA";

    /** Attendance Absence (Daily Attendance) Service */
    public static final String ATND_ATTENDANCE_ABSENCE = "ATND_ATTENDANCE_ABSENCE";

    /** Process Terminal Service (under Attendance Absence) */
    public static final String ATND_PROCESS_TERMINAL = "ATND_PROCESS_TERMINAL";

    /** Attendance Policy Config Service */
    public static final String ATND_POLICY_CONFIG = "ATND_POLICY_CONFIG";

    /** Shift Plan Service */
    public static final String COM_SHIFT_PLAN = "COM_SHIFT_PLAN";
    // ** Labour Contract Services */
    public static final String EMP_LABOUR_CONTRACT = "EMP_LABOUR_CONTRACT";

    /** Employee Cost Center Service */
    public static final String EMP_COST_CENTER = "EMP_COST_CENTER";

    /** Employee Resigned Employee Service */
    public static final String EMP_RESIGNED = "EMP_RESIGNED";

    /** Employee Basic Salary Service */
    public static final String PAYROLL_BASIC_SALARY = "PAYROLL_BASIC_SALARY";

    /** Attendance Annual Leave Service */
    public static final String ATND_ANNUAL_LEAVE = "ATND_ANNUAL_LEAVE";

    /** Payroll Bonus Formula Service */
    public static final String PAYROLL_BONUS_FORMULA = "PAYROLL_BONUS_FORMULA";

    /** Payroll Process Salary Service */
    public static final String PAYROLL_PROCESS_SALARY = "PAYROLL_PROCESS_SALARY";

    // ** Salary Adjustment Service */
    public static final String PAYROLL_SALARY_ADJUSTMENT = "PAYROLL_SALARY_ADJUSTMENT";

    /** Attendance Absence Type Service */
    public static final String ATND_ABSENCE_TYPE = "ATND_ABSENCE_TYPE";

    /** Employee Health Service */
    public static final String EMP_HEALTH = "EMP_HEALTH";

    /** Vehicle Service */
    public static final String COM_VEHICLE = "COM_VEHICLE";

    /** Route Service */
    public static final String COM_ROUTE = "COM_ROUTE";

    /** Dashboard Summary Service */
    public static final String DASHBOARD_SUMMARY = "DASHBOARD_SUMMARY";

    /** Dashboard Layout Service */
    public static final String DASHBOARD_LAYOUT = "DASHBOARD_LAYOUT";

    /** Dashboard Todo Service */
    public static final String DASHBOARD_TODO = "DASHBOARD_TODO";

    /** Email Management Service */
    public static final String SYS_EMAIL = "SYS_EMAIL";

    /** Terminal Management Service (Time Machine) */
    public static final String TERMINAL_MANAGEMENT = "TERMINAL_MANAGEMENT";

    /** Terminal Command / Terminal Users Service (Time Machine) */
    public static final String TERMINAL_COMMAND = "TERMINAL_COMMAND";

    /** Score Scale Service */
    public static final String PEV_SCORE_SCALE = "PEV_SCORE_SCALE";

    /** Performance Evaluation Factor Service */
    public static final String PEV_FACTOR = "PEV_FACTOR";

    /** Performance Evaluation Period Service */
    public static final String PEV_PERIOD = "PEV_PERIOD";

    /** Performance Evaluation Template Service */
    public static final String PEV_TEMPLATE = "PEV_TEMPLATE";
    
    /** Report Attendance Log Service */
    public static final String RPT_ATTENDANCE_LOG = "RPT_ATTENDANCE_LOG";

    /** Performance Evaluation Service */
    public static final String PEV_EVALUATION = "PEV_EVALUATION";

    /** Performance Evaluation Result Service */
    public static final String PEV_EVALUATION_RESULT = "PEV_EVALUATION_RESULT";

    /** Performance Evaluation Improvement Plan Service */
    public static final String PEV_IMPROVEMENT_PLAN = "PEV_IMPROVEMENT_PLAN";

    /** Report Absence Log Service */
    public static final String RPT_ABSENCE_LOG = "RPT_ABSENCE_LOG";

    /** Report Time Summary Service */
    public static final String RPT_TIME_SUMMARY = "RPT_TIME_SUMMARY";

    /** AI View Registry Service */
    public static final String AI_VIEW_REGISTRY = "AI_VIEW_REGISTRY";
}
