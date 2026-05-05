package com.pos.services;

import com.pos.dtos.request.*;
import com.pos.dtos.response.*;
import java.util.List;

public interface SupplierService {
    SupplierResponse create(SupplierRequest request);

    SupplierResponse update(Long id, SupplierRequest request);

    List<SupplierResponse> findAll();

    void delete(Long id);
}
