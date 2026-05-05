package com.pos.supplier.service;

import com.pos.supplier.dto.*;
import java.util.List;

public interface SupplierService {
    SupplierResponse create(SupplierRequest request);
    SupplierResponse update(Long id, SupplierRequest request);
    List<SupplierResponse> findAll();
    void delete(Long id);
}
