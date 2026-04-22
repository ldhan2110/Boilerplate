package com.clt.hrm.tenant.annotations;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ ElementType.METHOD, ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface ModuleValid {
    /**
     * Business service / program / module code
     * Example: EMPLOYEE, PAYROLL, HR_CORE
     */
    String moduleCode();

    /**
     * Skip validation (login, health check, etc.)
     */
    boolean skip() default false;
}