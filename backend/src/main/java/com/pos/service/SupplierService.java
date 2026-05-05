package com.pos.service;

import com.pos.dto.request.*;
import com.pos.dto.response.*;
import java.util.List;

public interface SupplierService {
    SupplierResponse create(SupplierRequest request);

    SupplierResponse update(Long id, SupplierRequest request);

    List<SupplierResponse> findAll();

    void delete(Long id);
}
