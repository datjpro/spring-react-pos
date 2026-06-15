package com.pos.services;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import java.util.List;

public interface BranchService {
    BranchResponse findById(Long id);

    BranchResponse create(BranchRequest request);

    BranchResponse update(Long id, BranchRequest request);

    List<BranchResponse> findAll();

    void delete(Long id);
}
