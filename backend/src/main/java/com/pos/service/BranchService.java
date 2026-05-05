package com.pos.service;

import com.pos.dto.request.*;
import com.pos.dto.response.*;
import java.util.List;

public interface BranchService {
    BranchResponse create(BranchRequest request);
    BranchResponse update(Long id, BranchRequest request);
    List<BranchResponse> findAll();
    void delete(Long id);
}
