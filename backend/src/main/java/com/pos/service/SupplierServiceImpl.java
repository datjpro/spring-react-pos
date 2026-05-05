package com.pos.service;

import com.pos.common.exception.*;
import com.pos.dto.request.*;
import com.pos.dto.response.*;
import com.pos.entity.SupplierEntity;
import com.pos.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class SupplierServiceImpl implements SupplierService {
    private final SupplierRepository supplierRepository;
    public SupplierServiceImpl(SupplierRepository supplierRepository){this.supplierRepository=supplierRepository;}
    @Transactional public SupplierResponse create(SupplierRequest request){ if(supplierRepository.existsByCodeIgnoreCase(request.code())) throw new DuplicateResourceException("Supplier code already exists"); SupplierEntity e=new SupplierEntity(); apply(e,request); return map(supplierRepository.save(e));}
    @Transactional public SupplierResponse update(Long id, SupplierRequest request){ SupplierEntity e=find(id); apply(e,request); return map(supplierRepository.save(e));}
    public List<SupplierResponse> findAll(){return supplierRepository.findByActiveTrueOrderByNameAsc().stream().map(this::map).toList();}
    @Transactional public void delete(Long id){SupplierEntity e=find(id); e.setActive(false);}
    private SupplierEntity find(Long id){return supplierRepository.findByIdAndActiveTrue(id).orElseThrow(() -> new ResourceNotFoundException("Supplier not found"));}
    private void apply(SupplierEntity e,SupplierRequest r){e.setCode(r.code());e.setName(r.name());e.setPhone(r.phone());e.setEmail(r.email());e.setAddress(r.address());}
    private SupplierResponse map(SupplierEntity e){return new SupplierResponse(e.getId(),e.getCode(),e.getName(),e.getPhone(),e.getEmail(),e.getAddress(),e.isActive());}
}
