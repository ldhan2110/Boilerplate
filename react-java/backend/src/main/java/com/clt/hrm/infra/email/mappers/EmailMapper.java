package com.clt.hrm.infra.email.mappers;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.clt.hrm.infra.email.dtos.EmailAttachmentDetailDto;
import com.clt.hrm.infra.email.dtos.EmailAttachmentDto;
import com.clt.hrm.infra.email.dtos.EmailDetailDto;
import com.clt.hrm.infra.email.dtos.EmailDto;
import com.clt.hrm.infra.email.dtos.EmailListDto;
import com.clt.hrm.infra.email.dtos.SearchEmailDto;

@Mapper
public interface EmailMapper {
    void insertEmail(EmailDto email);
    String selectEmailAttachmentId(String coId);
    void insertEmailAttachment(EmailAttachmentDto emailAttachment);
    void updateEmailStatus(EmailDto email);
    int countInFlightOrSentBySysMsg(SearchEmailDto search);
    List<EmailListDto> selectEmailList(SearchEmailDto search);
    int selectEmailCount(SearchEmailDto search);
    EmailDetailDto selectEmail(EmailDto email);
    List<EmailAttachmentDetailDto> selectEmailAttachments(EmailDto email);
    void deleteEmail(EmailDto email);
    void deleteEmailAttachments(EmailDto email);

    /**
     * Batch insert multiple email records in a single statement.
     * Each item must have coId, emlTo, emlSubjVal, emlCntnVal, emlSndStsCd, emlSysMsg, creUsrId, updUsrId set.
     * emlId is generated inside the SQL via get_mdl_seq2.
     */
    void insertEmailsBatch(List<EmailDto> emails);

    /**
     * Bulk idempotency check: given a list of candidate sysMsg keys, return only those
     * that already exist in COM_EML_SND with an in-flight or delivered status
     * (QUEUED / PROCESSING / PENDING / SUCCESS).
     * Replaces N individual countInFlightOrSentBySysMsg calls with a single IN-query.
     *
     * @param search must have coId and sysMsgs populated
     * @return set of sysMsg values that are already present (caller should skip these)
     */
    List<String> selectProcessedSysMsgs(SearchEmailDto search);

    /**
     * SELECT a batch of QUEUED payslip emails for the given company, then immediately
     * UPDATE their status to PROCESSING — using FOR UPDATE SKIP LOCKED so multiple
     * nodes never pick the same rows. Returns the locked rows.
     */
    List<EmailDto> selectAndLockQueuedEmails(SearchEmailDto search);

    /**
     * Update rows that have been stuck in PROCESSING for longer than {@code staleMinutes}
     * back to QUEUED so the recovery scheduler can re-dispatch them (crash recovery).
     * Returns the number of rows reset.
     */
    int resetStaleProcessingEmails(SearchEmailDto search);

    /**
     * Find all tenant IDs that still have rows needing action (QUEUED or stale PROCESSING).
     * Used by the recovery scheduler to know which tenants to process.
     */
    List<String> selectCoIdsWithPendingPayslipEmails(SearchEmailDto search);
}
