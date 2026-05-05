package com.pos.branch.service;

import com.pos.branch.dto.*;
import java.util.List;

public interface BranchService {
    BranchResponse create(BranchRequest request);
    BranchResponse update(Long id, BranchRequest request);
    List<BranchResponse> findAll();
    void delete(Long id);
}
