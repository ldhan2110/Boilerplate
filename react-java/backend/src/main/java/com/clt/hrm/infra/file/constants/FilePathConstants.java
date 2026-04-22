package com.clt.hrm.infra.file.constants;

/**
 * Constants for file storage sub-paths.
 * These constants define the sub-directory structure within each company's folder.
 * 
 * File storage structure:
 * {root}/{companyId}/{subPath}/filename
 * 
 * Example:
 * - uploads/COMP001/employee-image/abc123.jpg
 * - uploads/COMP001/contract/xyz789.pdf
 * - uploads/COMP001/uploads/temp-file.doc
 */
public class FilePathConstants {
    
    /**
     * Sub-path for employee profile images
     */
    public static final String EMPLOYEE_IMAGE = "employee-image";

    /**
     * Sub-path for user avatars
     */
    public static final String USER_AVATAR = "user-avatar";

    /**
     * Sub-path for company logos
     */
    public static final String LOGO = "logo";
    
    /**
     * Sub-path for contract documents
     */
    public static final String CONTRACT = "contract";
    
    /**
     * Sub-path for general uploads
     */
    public static final String UPLOADS = "uploads";
    
    /**
     * Sub-path for document attachments
     */
    public static final String DOCUMENTS = "documents";
    
    /**
     * Sub-path for reports
     */
    public static final String REPORTS = "reports";
    
    /**
     * Sub-path for exports
     */
    public static final String EXPORTS = "exports";
    
    /**
     * Sub-path for temporary files
     */
    public static final String TEMP = "temp";

    /**
     * Sub-path for email attachments
     */
    public static final String EMAIL_ATTACHMENT = "email-attachment";

    /**
     * Sub-path for employee health documents
     */
    public static final String EMPLOYEE_HEALTH = "employee-health";

    /**
     * Sub-path for AI policy documents (RAG pipeline)
     */
    public static final String POLICY_DOCUMENTS = "policy-documents";
    
    /**
     * Default sub-path when not specified
     */
    public static final String DEFAULT = UPLOADS;
    
    // Private constructor to prevent instantiation
    private FilePathConstants() {
        throw new UnsupportedOperationException("Constants class cannot be instantiated");
    }
}

